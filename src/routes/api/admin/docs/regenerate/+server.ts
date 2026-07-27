import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { requireAdmin } from '$lib/server/adminAuth';

const execAsync = promisify(exec);

export const POST: RequestHandler = async ({ locals }) => {
	await requireAdmin(locals.user?.id, locals.supabase);

	try {
		// Fixed script path with no request-derived input — if this endpoint
		// ever grows parameters, do not interpolate them into this command.
		const scriptPath = join(process.cwd(), 'scripts', 'generate-docs.py');
		const { stdout, stderr } = await execAsync(`python "${scriptPath}"`);

		if (stderr) {
			console.error('Script stderr:', stderr);
		}

		return json({
			success: true,
			message: 'Documentation regenerated successfully',
			output: stdout
		});
	} catch (error) {
		console.error('Error regenerating docs:', error);
		return json(
			{
				error: 'Failed to regenerate documentation',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
