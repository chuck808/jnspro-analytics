/**
 * Session Notes Types
 * For collaborative note-taking between riders, parents, and coaches
 */

export type NoteType = 'pre' | 'during' | 'post' | 'coach';
export type AuthorRole = 'rider' | 'parent' | 'coach';

export interface SessionNote {
    id: string;
    session_id: string;
    user_id: string;
    note_type: NoteType;
    content: string;
    created_at: string;
    updated_at: string;
    author_role: AuthorRole | null;
    
    // Joined data (optional)
    author_name?: string;
    author_email?: string;
}

export interface CreateNoteInput {
    session_id: string;
    note_type: NoteType;
    content: string;
    author_role?: AuthorRole;
}

export interface UpdateNoteInput {
    id: string;
    content: string;
}

export interface NotesByType {
    pre: SessionNote[];
    during: SessionNote[];
    post: SessionNote[];
    coach: SessionNote[];
}

/**
 * Note type metadata for UI display
 */
export const NOTE_TYPE_CONFIG: Record<NoteType, {
    label: string;
    description: string;
    icon: string;
    color: string;
    placeholder: string;
}> = {
    pre: {
        label: 'Pre-Session',
        description: 'Goals and focus areas before the session',
        icon: '🎯',
        color: '#f5a623',
        placeholder: 'What are you focusing on today? Any specific goals or technique points to work on?',
    },
    during: {
        label: 'During Session',
        description: 'Observations and real-time notes',
        icon: '📝',
        color: '#ff6b3d',
        placeholder: 'What did you notice during the session? Any adjustments made?',
    },
    post: {
        label: 'Post-Session',
        description: 'Reflections after completing the session',
        icon: '💭',
        color: '#3de8c8',
        placeholder: 'How did it go? What did you learn? What will you work on next time?',
    },
    coach: {
        label: 'Coach Feedback',
        description: 'Technical feedback and recommendations',
        icon: '🏆',
        color: '#9b87f5',
        placeholder: 'Technical observations, strengths to build on, areas for improvement...',
    },
};
