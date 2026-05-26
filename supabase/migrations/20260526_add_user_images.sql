-- User Images Feature
-- Date: 2026-05-26
-- Description: Adds profile icon and background image support for users
--
-- This migration adds:
-- 1. Image storage paths to profiles table
-- 2. Display opt-in settings to user_preferences
-- 3. Storage bucket for user images with appropriate RLS policies

-- ============================================================================
-- ADD IMAGE FIELDS TO PROFILES TABLE
-- ============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_icon_url TEXT,
ADD COLUMN IF NOT EXISTS background_image_url TEXT,
ADD COLUMN IF NOT EXISTS profile_icon_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS background_image_updated_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.profile_icon_url IS 'Storage path for user profile icon (displayed as circle)';
COMMENT ON COLUMN public.profiles.background_image_url IS 'Storage path for user background/banner image';
COMMENT ON COLUMN public.profiles.profile_icon_updated_at IS 'Timestamp of last profile icon update';
COMMENT ON COLUMN public.profiles.background_image_updated_at IS 'Timestamp of last background image update';

-- ============================================================================
-- ADD IMAGE DISPLAY PREFERENCES TO USER_PREFERENCES
-- ============================================================================

ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS show_profile_icon BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_background_image BOOLEAN DEFAULT true;

-- Add comments
COMMENT ON COLUMN public.user_preferences.show_profile_icon IS 'User opt-in to display their profile icon publicly';
COMMENT ON COLUMN public.user_preferences.show_background_image IS 'User opt-in to display their background image publicly';

-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================
-- Note: Supabase Storage buckets are typically created via the dashboard or Supabase CLI
-- This is documentation of the required bucket configuration:
--
-- Bucket name: user-images
-- Public: false (authenticated access only)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--
-- RLS Policies for user-images bucket:
-- 1. Users can upload to their own folder: user-images/{user_id}/*
-- 2. Users can delete their own images
-- 3. Users can read their own images
-- 4. Images are readable by authenticated users if display opt-in is enabled

-- Create storage bucket (if not exists - requires storage extension)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-images',
    'user-images',
    false,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Policy: Users can upload images to their own folder
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'user-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'user-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'user-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own images
CREATE POLICY "Users can read their own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'user-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Authenticated users can view profile icons if display is enabled
CREATE POLICY "Public profile icons are readable"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'user-images' AND
    name LIKE '%/profile-icon.%' AND
    EXISTS (
        SELECT 1 FROM public.user_preferences up
        WHERE up.user_id::text = (storage.foldername(name))[1]
        AND up.show_profile_icon = true
    )
);

-- Policy: Authenticated users can view background images if display is enabled
CREATE POLICY "Public background images are readable"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'user-images' AND
    name LIKE '%/background.%' AND
    EXISTS (
        SELECT 1 FROM public.user_preferences up
        WHERE up.user_id::text = (storage.foldername(name))[1]
        AND up.show_background_image = true
    )
);

-- ============================================================================
-- HELPER FUNCTION: Get public image URL if allowed
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_image_url(
    p_user_id UUID,
    p_image_type TEXT -- 'profile_icon' or 'background_image'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_image_url TEXT;
    v_show_image BOOLEAN;
BEGIN
    -- Get the image URL from profiles
    IF p_image_type = 'profile_icon' THEN
        SELECT profile_icon_url INTO v_image_url
        FROM public.profiles
        WHERE id = p_user_id;
        
        -- Check if user allows display
        SELECT COALESCE(show_profile_icon, true) INTO v_show_image
        FROM public.user_preferences
        WHERE user_id = p_user_id;
    ELSIF p_image_type = 'background_image' THEN
        SELECT background_image_url INTO v_image_url
        FROM public.profiles
        WHERE id = p_user_id;
        
        -- Check if user allows display
        SELECT COALESCE(show_background_image, true) INTO v_show_image
        FROM public.user_preferences
        WHERE user_id = p_user_id;
    ELSE
        RETURN NULL;
    END IF;
    
    -- Return URL only if display is allowed and user is viewing their own or it's opted in
    IF v_image_url IS NOT NULL AND (
        auth.uid() = p_user_id OR 
        v_show_image = true
    ) THEN
        RETURN v_image_url;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_image_url(UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_user_image_url IS 'Returns user image URL if display is allowed based on privacy settings';
