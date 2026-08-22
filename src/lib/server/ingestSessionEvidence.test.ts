import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/sessionIngestGuard', () => ({
	calculateSessionChecksum: vi.fn(async () => 'checksum-1'),
	findSessionByChecksum: vi.fn(),
	isUniqueViolation: vi.fn(() => false),
	rollbackIncompleteSession: vi.fn(async () => undefined)
}));

vi.mock('$lib/server/reconcilePerformanceSnapshot', () => ({
	reconcilePerformanceSnapshot: vi.fn(async () => undefined)
}));

import { ingestSessionEvidence } from './ingestSessionEvidence';
import {
	findSessionByChecksum,
	rollbackIncompleteSession
} from '$lib/server/sessionIngestGuard';
import { reconcilePerformanceSnapshot } from '$lib/server/reconcilePerformanceSnapshot';

const validFile = {
	schemaVersion: 2,
	sessionMetadata: {
		startTime: Date.UTC(2026, 7, 22, 12, 0, 0),
		distance: 10
	},
	runs: [
		{
			reactionTime: 250,
			elapsedMs: 1200,
			maxG: 1.2,
			avgG: 0.6,
			distance: 10,
			chartData: [100, 110],
			firmwareAnalytics: {
				valid: true,
				peakSpeedMs: 8.5
			},
			timeSeries: {
				sampleRateHz: 200,
				sampleCount: 2,
				pitchRad: [0, 0.1],
				rollRad: [0, 0.1],
				linearAccelG: [0.5, 0.6],
				rawAccelG: [0.7, 0.8]
			}
		}
	]
};

type FakeClientOptions = {
	bikeId?: string | null;
	profileId?: string | null;
	timeseriesError?: { message: string } | null;
	gateError?: { message: string } | null;
};

function makeClient(options: FakeClientOptions = {}) {
	const inserts: Array<{ table: string; payload: unknown }> = [];
	const client = {
		from(table: string) {
			const chain: any = {
				select: () => chain,
				eq: () => chain,
				order: () => chain,
				limit: () => chain,
				maybeSingle: async () => {
					if (table === 'bikes') {
						return {
							data: options.bikeId ? { id: options.bikeId } : null,
							error: null
						};
					}
					if (table === 'rider_profiles') {
						return {
							data: options.profileId ? { id: options.profileId } : null,
							error: null
						};
					}
					return { data: null, error: null };
				},
				insert: (payload: unknown) => {
					inserts.push({ table, payload });
					if (table === 'gate_runs') {
						return Promise.resolve({ error: options.gateError ?? null });
					}
					if (table === 'run_timeseries') {
						return Promise.resolve({ error: options.timeseriesError ?? null });
					}
					return chain;
				},
				single: async () => {
					if (table === 'sessions') return { data: { id: 'session-1' }, error: null };
					if (table === 'runs') return { data: { id: 'run-1' }, error: null };
					return { data: null, error: null };
				}
			};
			return chain;
		}
	};

	return { client: client as any, inserts };
}

describe('ingestSessionEvidence', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(findSessionByChecksum).mockResolvedValue({ data: null, error: null } as any);
	});

	it('treats an existing checksum as transport-independent duplicate evidence', async () => {
		vi.mocked(findSessionByChecksum).mockResolvedValue({
			data: {
				id: 'existing-session',
				timestamp: '2026-08-22T12:00:00.000Z',
				session_type: 'gate',
				runs: [{ id: 'run-existing' }]
			},
			error: null
		} as any);

		const { client, inserts } = makeClient();
		const result = await ingestSessionEvidence({
			persistenceClient: client,
			reconciliationClient: client,
			userId: 'rider-1',
			fileData: validFile,
			logPrefix: '[test]'
		});

		expect(result.outcome).toBe('duplicate');
		expect(inserts).toHaveLength(0);
		expect(reconcilePerformanceSnapshot).not.toHaveBeenCalled();
	});

	it('keeps missing bike/profile linkage non-blocking', async () => {
		const { client, inserts } = makeClient({ bikeId: null, profileId: null });
		const result = await ingestSessionEvidence({
			persistenceClient: client,
			reconciliationClient: client,
			userId: 'rider-1',
			fileData: validFile,
			logPrefix: '[test]'
		});

		expect(result).toMatchObject({
			outcome: 'created',
			bikeLinked: false,
			profileLinked: false,
			runsImported: 1
		});
		const sessionInsert = inserts.find((entry) => entry.table === 'sessions');
		expect(sessionInsert?.payload).toMatchObject({ bike_id: null, rider_profile_id: null });
		expect(reconcilePerformanceSnapshot).toHaveBeenCalledOnce();
	});

	it('keeps optional timeseries failure as degraded success without rollback', async () => {
		const { client } = makeClient({ timeseriesError: { message: 'timeseries unavailable' } });
		const result = await ingestSessionEvidence({
			persistenceClient: client,
			reconciliationClient: client,
			userId: 'rider-1',
			fileData: validFile,
			logPrefix: '[test]'
		});

		expect(result).toMatchObject({
			outcome: 'created',
			timeseriesCount: 0,
			timeseriesFailed: 1,
			timeseriesErrors: ['Run 1: timeseries unavailable']
		});
		if (result.outcome === 'created') {
			expect(result.warnings.some((warning) => warning.includes('timeseries data that failed'))).toBe(true);
		}
		expect(rollbackIncompleteSession).not.toHaveBeenCalled();
		expect(reconcilePerformanceSnapshot).toHaveBeenCalledOnce();
	});
});
