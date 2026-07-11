import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execAsync = promisify(exec);

export const POST: RequestHandler = async ({ locals }) => {
	// Check if user is authenticated
	if (!locals.user?.id) {
		throw error(401, 'Unauthorized');
	}

	// Check if user has admin role in database
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', locals.user.id)
		.single();

	if (profile?.role !== 'admin') {
		throw error(403, 'Access denied');
	}

	try {
		// Run the Python script to regenerate docs
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
