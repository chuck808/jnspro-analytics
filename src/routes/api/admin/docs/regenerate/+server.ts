import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execAsync = promisify(exec);

export const POST: RequestHandler = async ({ locals }) => {
    // Check if user is admin
    if (locals.user?.role !== 'admin') {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        // Run the Python script to regenerate docs
        const scriptPath = join(process.cwd(), 'scripts', 'generate-docs.py');
        const { stdout, stderr } = await execAsync(`python "${scriptPath}"`);

        if (stderr) {
            console.error('Script stderr:', stderr);
        }

        console.log('Script output:', stdout);

        return json({ 
            success: true,
            message: 'Documentation regenerated successfully',
            output: stdout
        });
    } catch (error) {
        console.error('Error regenerating docs:', error);
        return json({ 
            error: 'Failed to regenerate documentation',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};
