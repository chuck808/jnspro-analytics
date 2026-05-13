import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';

export const GET: RequestHandler = async ({ locals }) => {
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

    try {
        // Read markdown files from docs/chapters directory
        const chaptersDir = path.join(process.cwd(), 'docs', 'chapters');
        const files = await fs.readdir(chaptersDir);
        
        // Filter for .md files and extract chapter info
        const chapters = files
            .filter((file: string) => file.endsWith('.md'))
            .map((file: string) => {
                // Extract slug from filename
                // Files are named like: appgatepro_session_chapter.md or reports-chapter.md
                let slug = file.replace('.md', '');
                slug = slug.replace(/^appgatepro_/, '');
                slug = slug.replace(/-chapter$|_chapter$/, '');
                
                // Create a nice title
                const title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
                
                return {
                    slug,
                    filename: file,
                    title,
                    icon: '📄',
                    desc: `${title} documentation`
                };
            });

        return json(chapters);
    } catch (error) {
        console.error('Error reading chapters:', error);
        return json({ error: 'Failed to read chapters' }, { status: 500 });
    }
};
