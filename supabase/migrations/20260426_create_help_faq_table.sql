-- Create help_faqs table for admin-manageable FAQ content
CREATE TABLE IF NOT EXISTS public.help_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('general', 'analytics', 'sessions', 'upload', 'goals', 'technical')),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add RLS policies
ALTER TABLE public.help_faqs ENABLE ROW LEVEL SECURITY;

-- Anyone can read published FAQs
CREATE POLICY "Anyone can read published FAQs"
    ON public.help_faqs
    FOR SELECT
    USING (is_published = true);

-- Only admins can insert FAQs
CREATE POLICY "Admins can insert FAQs"
    ON public.help_faqs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can update FAQs
CREATE POLICY "Admins can update FAQs"
    ON public.help_faqs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can delete FAQs
CREATE POLICY "Admins can delete FAQs"
    ON public.help_faqs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create index for faster queries
CREATE INDEX idx_help_faqs_category ON public.help_faqs(category);
CREATE INDEX idx_help_faqs_published ON public.help_faqs(is_published);
CREATE INDEX idx_help_faqs_order ON public.help_faqs(display_order);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_help_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_help_faqs_updated_at
    BEFORE UPDATE ON public.help_faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_help_faqs_updated_at();

-- Insert some default FAQs
INSERT INTO public.help_faqs (question, answer, category, display_order, is_published) VALUES
('How do I upload my training data?', 'Navigate to the Upload page from the sidebar menu. You can drag and drop CSV files or click to browse. Ensure your CSV files follow the required format with columns for date, distance, time, etc.', 'upload', 1, true),
('What file format should I use for uploads?', 'We support CSV files with the following required columns: date, distance, duration. Optional columns include heart_rate, pace, notes, and session_type.', 'upload', 2, true),
('How are my analytics calculated?', 'Analytics are calculated using your uploaded session data. We analyze trends, performance metrics, pace variations, and training load over time. The system uses advanced algorithms to provide insights into your training patterns.', 'analytics', 1, true),
('What is a training goal?', 'A training goal is a target you set for yourself, such as a target distance, time, or performance metric. You can track your progress towards these goals in the Goals section.', 'goals', 1, true),
('Can I export my data?', 'Currently, data export functionality is in development. You can view and analyze all your data through the various analytics dashboards.', 'technical', 1, true),
('How do I view my training history?', 'Go to the Sessions page to view all your past training sessions. You can filter by date range, session type, and search for specific sessions.', 'sessions', 1, true);
