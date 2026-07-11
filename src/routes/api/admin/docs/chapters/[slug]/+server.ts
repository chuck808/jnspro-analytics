import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';

const CHAPTERS_DIR = path.join(process.cwd(), 'docs', 'chapters');

// Helper function to find the actual filename for a slug
async function findChapterFile(slug: string): Promise<string | null> {
	try {
		const files = await fs.readdir(CHAPTERS_DIR);

		// Try different filename patterns
		const patterns = [
			`${slug}.md`,
			`appgatepro_${slug}_chapter.md`,
			`${slug}-chapter.md`,
			`appgatepro-${slug}-chapter.md`
		];

		for (const pattern of patterns) {
			if (files.includes(pattern)) {
				return pattern;
			}
		}

		return null;
	} catch (error) {
		console.error('Error finding chapter file:', error);
		return null;
	}
}

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user is admin by querying the profiles table
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', locals.user.id)
		.single();

	if (profile?.role !== 'admin') {
		return json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
	}

	const { slug } = params;

	try {
		// Find the actual file for this slug
		const filename = await findChapterFile(slug);

		if (!filename) {
			return json({ error: 'Chapter not found' }, { status: 404 });
		}

		// Read the markdown file
		const filePath = path.join(CHAPTERS_DIR, filename);
		const markdown = await fs.readFile(filePath, 'utf-8');

		return json({ markdown });
	} catch (error) {
		console.error('Error reading chapter:', error);
		return json({ error: 'Chapter not found' }, { status: 404 });
	}
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user is admin by querying the profiles table
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', locals.user.id)
		.single();

	if (profile?.role !== 'admin') {
		return json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
	}

	const { slug } = params;
	const { markdown } = await request.json();

	try {
		// Find the actual file for this slug
		const filename = await findChapterFile(slug);

		if (!filename) {
			return json({ error: 'Chapter not found' }, { status: 404 });
		}

		// Write the markdown file
		const filePath = path.join(CHAPTERS_DIR, filename);
		await fs.writeFile(filePath, markdown, 'utf-8');

		return json({ success: true });
	} catch (error) {
		console.error('Error writing chapter:', error);
		return json({ error: 'Failed to save chapter' }, { status: 500 });
	}
};
