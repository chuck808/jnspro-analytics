<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { AdjustmentSuggestionModal } from '$lib/components/goals';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const METRICS = [
		{
			id: 'reactionTime',
			label: 'Reaction Time',
			unit: 's',
			direction: 'lower',
			category: 'Gate',
			desc: 'Best eligible reaction time',
			format: (v: number) => `${(v / 1000).toFixed(3)}s`,
			fromDb: (v: number) => v / 1000
		},
		{
			id: 'maxG',
			label: 'Peak G-Force',
			unit: 'G',
			direction: 'higher',
			category: 'Gate',
			desc: 'Highest eligible measured G-force',
			format: (v: number) => `${v.toFixed(2)}G`
		},
		{
			id: 'peakSpeed',
			label: 'Peak Speed',
			unit: 'km/h',
			direction: 'higher',
			category: 'Gate',
			desc: 'Best valid IMU-derived peak speed',
			format: (v: number) => `${(v * 3.6).toFixed(1)} km/h`,
			fromDb: (v: number) => v * 3.6
		},
		{
			id: 'consistency',
			label: 'Consistency Score',
			unit: '%',
			direction: 'higher',
			category: 'Gate',
			desc: 'Reaction-time repeatability, where higher is better',
			format: (v: number) => `${v.toFixed(1)}%`
		},
		{
			id: 'elapsedTime',
			label: 'Elapsed Time',
			unit: 's',
			direction: 'lower',
			category: 'Gate',
			desc: 'Best eligible elapsed time; optionally track one distance only',
			format: (v: number) => `${v.toFixed(3)}s`
		},
		{
			id: 'accelerationPhase',
			label: 'Acceleration Phase',
			unit: 's',
			direction: 'lower',
			category: 'Technique',
			desc: 'Best valid time to reach peak speed',
			format: (v: number) => `${v.toFixed(3)}s`
		},
		{
			id: 'endurance',
			label: 'Gates per Session',
			unit: 'runs',
			direction: 'higher',
			category: 'Training',
			desc: 'Number of eligible gate runs in a session',
			format: (v: number) => `${Math.round(v)} runs`
		}
	] as const;

	type MetricId = (typeof METRICS)[number]['id'];
	type Goal = (typeof data.goals)[number] & {
		computed_current?: number | null;
		prediction?: any;
		progressStatus?: string;
		percentComplete?: number;
		adaptiveAnalysis?: any;
		goal_milestones?: any[];
	};

	function getMetric(id: string) {
		return METRICS.find((metric) => metric.id === id);
	}

	let showAddForm = $state(false);
	let selectedMetric = $state<MetricId>('reactionTime');
	let creating = $state(false);
	let showCompleted = $state(false);
	let selectedGoalForSuggestions: Goal | null = $state(null);

	let activeGoals = $derived((data.goals as Goal[]).filter((goal) => !goal.completed_at));
	let completedGoals = $derived((data.goals as Goal[]).filter((goal) => goal.completed_at));
	let currentForMetric = $derived(
		((data.currentValues as Record<string, number | null>)?.[selectedMetric] as number | null) ?? null
	);

	let startValue: number | '' = $state('');
	$effect(() => {
		const metric = getMetric(selectedMetric) as any;
		startValue =
			currentForMetric !== null
				? Number((metric?.fromDb?.(currentForMetric) ?? currentForMetric).toFixed(3))
				: '';
	});

	function fmtValue(metric: ReturnType<typeof getMetric>, value: number | null | undefined): string {
		if (value === null || value === undefined) return '—';
		return metric?.format(value) ?? String(value);
	}

	function successFor(key: string) {
		return (form as any)?.[key] === true;
	}

	function errorFor(key: string) {
		return (form as any)?.[key] as string | undefined;
	}

	function lowerIsBetter(goal: Goal) {
		return getMetric(goal.metric)?.direction === 'lower';
	}

	function bestFor(goal: Goal): number | null {
		return goal.computed_current ?? goal.current_value ?? goal.start_value ?? null;
	}

	function progressFor(goal: Goal): number {
		if (Number.isFinite(goal.percentComplete)) {
			return Math.min(100, Math.max(0, Number(goal.percentComplete)));
		}

		const current = bestFor(goal);
		const start = goal.start_value;
		const target = goal.target_value;
		if (current === null || start === null || target === null) return 0;

		const denominator = lowerIsBetter(goal) ? start - target : target - start;
		const numerator = lowerIsBetter(goal) ? start - current : current - start;
		if (denominator === 0) return 0;
		return Math.min(100, Math.max(0, (numerator / denominator) * 100));
	}

	function targetReached(goal: Goal): boolean {
		const best = bestFor(goal);
		if (best === null || goal.target_value === null) return false;
		return lowerIsBetter(goal) ? best <= goal.target_value : best >= goal.target_value;
	}

	function hasProgressEvidence(goal: Goal): boolean {
		const best = bestFor(goal);
		if (best === null || goal.start_value === null) return false;
		return best !== goal.start_value || (goal.goal_milestones?.length ?? 0) > 0;
	}

	function statusText(status: string | undefined) {
		switch (status) {
			case 'way_ahead':
				return 'well ahead of target-date pace';
			case 'ahead':
				return 'ahead of target-date pace';
			case 'behind':
				return 'behind target-date pace';
			case 'way_behind':
				return 'well behind target-date pace';
			case 'stalled':
				return 'little recent goal movement';
			default:
				return 'roughly on target-date pace';
		}
	}

	function dateText(value: string | null | undefined) {
		if (!value) return '—';
		return new Date(value).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Training Goals — AppGatePro</title>
</svelte:head>

<div class="space-y-6">
	<section class="themed-card rounded-2xl p-6 sm:p-8">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="max-w-3xl">
				<p class="themed-accent text-xs font-semibold tracking-wider uppercase">Goals</p>
				<h1 class="themed-text-primary mt-1 text-3xl font-bold">Targets backed by your evidence</h1>
				<p class="themed-text-secondary mt-3 text-sm leading-relaxed">
					Choose a performance target and track the best eligible evidence recorded since the goal
					began. Predictions and adjustment suggestions are estimates layered on top of that evidence;
					they are never recorded results and are never applied automatically.
				</p>
			</div>
			<button
				onclick={() => (showAddForm = !showAddForm)}
				class="min-h-[44px] rounded-lg bg-[#f5a623] px-5 py-3 text-sm font-semibold text-[#0a0809]
                       transition-colors hover:bg-[#c97e0a] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
			>
				{showAddForm ? 'Cancel' : 'Create goal'}
			</button>
		</div>

		<div class="mt-5 flex flex-wrap gap-2 text-xs">
			<span class="rounded-full border border-[#3de8c8]/20 bg-[#3de8c8]/10 px-3 py-1.5 text-[#3de8c8]">
				Evidence: measured or valid derived session data
			</span>
			<span class="rounded-full border border-[#f5a623]/20 bg-[#f5a623]/10 px-3 py-1.5 text-[#f5a623]">
				Estimates: prediction and pace interpretation
			</span>
		</div>
	</section>

	{#if successFor('createSuccess') || successFor('completeSuccess') || successFor('deleteSuccess') || successFor('adjustSuccess')}
		<div class="rounded-xl border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-4 text-sm text-[#3de8c8]">
			Goal updated successfully.
		</div>
	{/if}
	{#if errorFor('createError') || errorFor('completeError') || errorFor('deleteError') || errorFor('adjustError')}
		<div class="rounded-xl border border-red-800 bg-red-900/20 p-4 text-sm text-red-300">
			{errorFor('createError') || errorFor('completeError') || errorFor('deleteError') || errorFor('adjustError')}
		</div>
	{/if}

	{#if data.sessionCount === 0}
		<div class="themed-card rounded-xl p-4 text-sm">
			<p class="themed-text-primary font-medium">No session evidence yet</p>
			<p class="themed-text-secondary mt-1">
				You can create a goal now, but automatic Best so far updates begin once eligible sessions are
				uploaded.
			</p>
		</div>
	{/if}

	{#if showAddForm}
		<section class="rounded-xl border border-[#f5a623]/20 bg-[#131010] p-5 sm:p-6">
			<div class="mb-5">
				<h2 class="text-lg font-semibold text-[#f0ece4]">Create a training goal</h2>
				<p class="mt-1 text-sm text-[#9a8f7a]">
					The start value is pre-filled from recent eligible evidence when available. You can edit it
					before creating the goal.
				</p>
			</div>

			<form method="POST" action="?/createGoal" onsubmit={() => (creating = true)} class="space-y-5">
				<div>
					<label for="metric" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
						Performance metric
					</label>
					<select id="metric" name="metric" bind:value={selectedMetric} class="input-field w-full">
						{#each ['Gate', 'Technique', 'Training'] as category}
							<optgroup label={category}>
								{#each METRICS.filter((metric) => metric.category === category) as metric}
									<option value={metric.id}>{metric.label} ({metric.unit})</option>
								{/each}
							</optgroup>
						{/each}
					</select>
					<p class="mt-1 text-xs text-[#6b5f4d]">
						{getMetric(selectedMetric)?.desc ?? ''}
						{#if currentForMetric !== null}
							· Recent evidence: {fmtValue(getMetric(selectedMetric), currentForMetric)}
						{/if}
					</p>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div>
						<label for="start_value" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
							Start ({getMetric(selectedMetric)?.unit})
						</label>
						<input
							id="start_value"
							name="start_value"
							type="number"
							step="any"
							required
							bind:value={startValue}
							class="input-field w-full"
						/>
					</div>
					<div>
						<label for="target_value" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
							Target ({getMetric(selectedMetric)?.unit})
						</label>
						<input
							id="target_value"
							name="target_value"
							type="number"
							step="any"
							required
							class="input-field w-full"
						/>
						<p class="mt-1 text-xs text-[#6b5f4d]">
							{getMetric(selectedMetric)?.direction === 'lower' ? 'Lower' : 'Higher'} is better
						</p>
					</div>
					<div>
						<label for="deadline" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
							Target date
						</label>
						<input
							id="deadline"
							name="deadline"
							type="date"
							required
							min={new Date().toISOString().split('T')[0]}
							class="input-field w-full"
						/>
					</div>
				</div>

				{#if selectedMetric === 'elapsedTime'}
					<div class="max-w-xs">
						<label for="distance_m" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
							Distance (m), optional
						</label>
						<input id="distance_m" name="distance_m" type="number" min="0" step="any" class="input-field w-full" />
						<p class="mt-1 text-xs text-[#6b5f4d]">
							If set, only like-for-like elapsed-time evidence at this distance can move the goal.
						</p>
					</div>
				{/if}

				<button type="submit" disabled={creating} class="btn-primary">
					{creating ? 'Creating…' : 'Create goal'}
				</button>
			</form>
		</section>
	{/if}

	<section class="space-y-4">
		<div class="flex items-end justify-between gap-4">
			<div>
				<h2 class="themed-text-primary text-xl font-semibold">Active goals</h2>
				<p class="themed-text-secondary mt-1 text-sm">
					Evidence first. Interpretation, estimates and suggested adjustments follow only where
					there is enough information to support them.
				</p>
			</div>
			<span class="themed-text-secondary text-sm">{activeGoals.length} active</span>
		</div>

		{#if activeGoals.length === 0}
			<div class="themed-card rounded-xl p-6 text-center">
				<p class="themed-text-primary font-medium">No active goals</p>
				<p class="themed-text-secondary mt-1 text-sm">
					Create one when there is something specific you want your session evidence to move toward.
				</p>
			</div>
		{:else}
			{#each activeGoals as goal}
				{@const metric = getMetric(goal.metric)}
				{@const best = bestFor(goal)}
				{@const pct = progressFor(goal)}
				{@const milestones = Array.isArray(goal.goal_milestones) ? goal.goal_milestones : []}
				{@const reached = targetReached(goal)}
				{@const evidenceMoved = hasProgressEvidence(goal)}

				<article class="rounded-xl border border-[#221c18] bg-[#131010] p-5 sm:p-6">
					<div class="flex flex-wrap items-start justify-between gap-4">
						<div>
							<p class="text-xs font-medium tracking-wider text-[#6b5f4d] uppercase">
								{metric?.category ?? 'Goal'}
							</p>
							<h3 class="mt-1 text-lg font-semibold text-[#f0ece4]">{metric?.label ?? goal.metric}</h3>
							<p class="mt-1 text-xs text-[#9a8f7a]">
								Target date {dateText(goal.deadline)}
								{#if goal.metric === 'elapsedTime' && goal.distance_m != null}
									· {goal.distance_m}m only
								{/if}
							</p>
						</div>
						{#if reached}
							<span class="rounded-full border border-[#3de8c8]/30 bg-[#3de8c8]/10 px-3 py-1 text-xs font-medium text-[#3de8c8]">
								Target reached by evidence
							</span>
						{/if}
					</div>

					<div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
						<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
							<p class="text-xs tracking-wide text-[#6b5f4d] uppercase">Start</p>
							<p class="mt-1 text-lg font-semibold text-[#f0ece4]">{fmtValue(metric, goal.start_value)}</p>
						</div>
						<div class="rounded-lg border border-[#3de8c8]/20 bg-[#3de8c8]/5 p-4">
							<p class="text-xs tracking-wide text-[#3de8c8] uppercase">Best so far</p>
							<p class="mt-1 text-lg font-bold text-[#3de8c8]">{fmtValue(metric, best)}</p>
							<p class="mt-1 text-xs text-[#6b5f4d]">Best eligible evidence since this goal began</p>
						</div>
						<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
							<p class="text-xs tracking-wide text-[#6b5f4d] uppercase">Target</p>
							<p class="mt-1 text-lg font-semibold text-[#f0ece4]">{fmtValue(metric, goal.target_value)}</p>
						</div>
					</div>

					<div class="mt-4">
						<div class="mb-2 flex items-center justify-between text-xs">
							<span class="text-[#9a8f7a]">Evidence progress toward target</span>
							<span class="font-semibold text-[#f0ece4]">{Math.round(pct)}%</span>
						</div>
						<div class="h-2.5 overflow-hidden rounded-full bg-[#221c18]">
							<div class="h-full rounded-full bg-[#3de8c8]" style={`width: ${pct}%`}></div>
						</div>
					</div>

					{#if milestones.length > 0}
						<div class="mt-5 border-t border-[#221c18] pt-4">
							<p class="text-xs font-medium tracking-wide text-[#6b5f4d] uppercase">Evidence milestones</p>
							<div class="mt-2 flex flex-wrap gap-2">
								{#each milestones as milestone}
									{#if milestone?.value !== undefined && milestone?.achieved_at}
										<span class="rounded-lg bg-[#0a0809] px-2.5 py-1.5 text-xs text-[#9a8f7a]">
											{fmtValue(metric, milestone.value)} · {dateText(milestone.achieved_at)}
										</span>
									{/if}
								{/each}
							</div>
						</div>
					{/if}

					{#if evidenceMoved && goal.progressStatus}
						<div class="mt-5 rounded-lg border border-[#f5a623]/15 bg-[#f5a623]/5 p-4">
							<p class="text-xs font-medium tracking-wide text-[#f5a623] uppercase">Progress interpretation</p>
							<p class="mt-1 text-sm text-[#f0ece4]">Your evidence is {statusText(goal.progressStatus)}.</p>
							<p class="mt-1 text-xs text-[#6b5f4d]">
								This compares evidence progress with the target date; it is interpretation, not a measured result.
							</p>
						</div>
					{/if}

					{#if goal.prediction && goal.prediction.sessionsRemaining !== null}
						<div class="mt-4 rounded-lg border border-[#9a8f7a]/20 bg-[#0a0809] p-4">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<p class="text-xs font-medium tracking-wide text-[#9a8f7a] uppercase">Estimated sessions remaining</p>
								<span class="text-xs text-[#6b5f4d]">Model estimate</span>
							</div>
							<div class="mt-1 flex flex-wrap items-baseline gap-2">
								<p class="text-xl font-bold text-[#f0ece4]">
									{goal.prediction.confidenceInterval?.median ?? goal.prediction.sessionsRemaining}
								</p>
								<p class="text-sm text-[#9a8f7a]">sessions</p>
								{#if goal.prediction.confidenceInterval}
									<p class="text-xs text-[#6b5f4d]">
										likely range {goal.prediction.confidenceInterval.lower}–{goal.prediction.confidenceInterval.upper}
									</p>
								{/if}
							</div>
							<p class="mt-2 text-xs text-[#6b5f4d]">
								Based on the goal's eligible progress evidence. The estimate can change as new sessions are recorded or evidence is reclassified.
							</p>
						</div>
					{/if}

					<div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#221c18] pt-4">
						<div>
							{#if goal.adaptiveAnalysis?.suggestions?.length > 0}
								<button
									onclick={() => (selectedGoalForSuggestions = goal)}
									class="min-h-[44px] rounded-lg border border-[#f5a623]/20 bg-[#f5a623]/10 px-3 py-2 text-xs font-medium text-[#f5a623]
                                           transition-colors hover:bg-[#f5a623]/20 focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
								>
									Review {goal.adaptiveAnalysis.suggestions.length} optional suggestion{goal.adaptiveAnalysis.suggestions.length === 1 ? '' : 's'}
								</button>
								<p class="mt-1 text-xs text-[#6b5f4d]">Suggestions are model-derived and require your approval.</p>
							{/if}
						</div>
						<div class="flex flex-wrap gap-2">
							<form method="POST" action="?/completeGoal">
								<input type="hidden" name="goal_id" value={goal.id} />
								<button
									type="submit"
									class="min-h-[44px] rounded-lg border border-[#9a8f7a]/30 px-3 py-2 text-xs text-[#9a8f7a]
                                           transition-colors hover:text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
								>
									Close goal
								</button>
							</form>
							<form method="POST" action="?/deleteGoal">
								<input type="hidden" name="goal_id" value={goal.id} />
								<button
									type="submit"
									class="min-h-[44px] rounded-lg px-3 py-2 text-xs text-[#6b5f4d] transition-colors hover:text-[#ff4444]"
								>
									Delete
								</button>
							</form>
						</div>
					</div>
					<p class="mt-2 text-xs text-[#6b5f4d]">
						Closing a goal records a finish date. It does not by itself claim that the performance target was achieved.
					</p>
				</article>
			{/each}
		{/if}
	</section>

	<div class="themed-card rounded-xl p-4 text-sm">
		<p class="themed-text-primary font-medium">Looking for current form or recovery patterns?</p>
		<p class="themed-text-secondary mt-1">
			Goals owns commitment and evidence-backed target progress. Longitudinal direction, repeatability and training-load/recovery signals live in
			<a href="/analytics" class="themed-accent font-medium hover:underline">Progress</a>.
		</p>
	</div>

	{#if completedGoals.length > 0}
		<section>
			<button
				onclick={() => (showCompleted = !showCompleted)}
				class="mb-3 rounded text-sm text-[#9a8f7a] transition-colors hover:text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
			>
				{showCompleted ? '▾' : '▸'} {completedGoals.length} closed goal{completedGoals.length === 1 ? '' : 's'}
			</button>

			{#if showCompleted}
				<div class="space-y-3">
					{#each completedGoals as goal}
						{@const metric = getMetric(goal.metric)}
						{@const best = bestFor(goal)}
						{@const reached = targetReached(goal)}
						<div class="rounded-xl border border-[#221c18] bg-[#131010] p-4">
							<div class="flex flex-wrap items-start justify-between gap-4">
								<div>
									<p class="text-xs font-medium text-[#9a8f7a]">Closed {dateText(goal.completed_at)}</p>
									<p class="mt-1 text-sm font-semibold text-[#f0ece4]">{metric?.label ?? goal.metric}</p>
									<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#9a8f7a]">
										<span>Best at closure: <strong class="text-[#f0ece4]">{fmtValue(metric, best)}</strong></span>
										<span>Target: <strong class="text-[#f0ece4]">{fmtValue(metric, goal.target_value)}</strong></span>
									</div>
									<p class="mt-2 text-xs {reached ? 'text-[#3de8c8]' : 'text-[#6b5f4d]'}">
										{reached ? 'Target was reached by eligible evidence before closure.' : 'Closed without eligible evidence reaching the target.'}
									</p>
								</div>
								<form method="POST" action="?/deleteGoal">
									<input type="hidden" name="goal_id" value={goal.id} />
									<button type="submit" class="min-h-[44px] px-2 text-xs text-[#6b5f4d] hover:text-[#ff4444]">
										Remove
									</button>
								</form>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>

{#if selectedGoalForSuggestions && selectedGoalForSuggestions.adaptiveAnalysis}
	<AdjustmentSuggestionModal
		suggestions={selectedGoalForSuggestions.adaptiveAnalysis.suggestions}
		open={true}
		onClose={() => (selectedGoalForSuggestions = null)}
		onApply={async (suggestion) => {
			const formData = new FormData();
			formData.append('goal_id', selectedGoalForSuggestions!.id);
			formData.append('adjustment_type', suggestion.type);

			if (suggestion.type === 'increase_target' || suggestion.type === 'decrease_target') {
				formData.append('new_value', String(suggestion.suggestedValue));
			} else if (suggestion.type === 'extend_deadline' || suggestion.type === 'shorten_deadline') {
				const dateValue =
					suggestion.suggestedValue instanceof Date
						? suggestion.suggestedValue.toISOString().split('T')[0]
						: suggestion.suggestedValue;
				formData.append('new_value', String(dateValue));
			}

			try {
				const response = await fetch('?/applySuggestion', { method: 'POST', body: formData });
				if (response.ok) {
					selectedGoalForSuggestions = null;
					window.location.reload();
				}
			} catch (error) {
				console.error('Error applying suggestion:', error);
			}
		}}
	/>
{/if}

<style>
	:global(.input-field) {
		padding: 0.625rem 1rem;
		background: #0a0809;
		border: 1px solid #221c18;
		border-radius: 0.5rem;
		color: #f0ece4;
		font-size: 0.875rem;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	:global(.input-field:focus) {
		outline: none;
		border-color: #f5a623;
		box-shadow: 0 0 0 1px #f5a623;
	}
	:global(.btn-primary) {
		padding: 0.625rem 1.25rem;
		min-height: 44px;
		background: #f5a623;
		color: #0a0809;
		font-weight: 600;
		font-size: 0.875rem;
		border-radius: 0.5rem;
		border: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}
	:global(.btn-primary:hover) {
		background: #c97e0a;
	}
	:global(.btn-primary:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
