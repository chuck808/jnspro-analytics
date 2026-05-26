# User Images Implementation Guide

## Overview
This document describes the implementation of the user image upload system for AppGatePro Analytics. Users can now upload two types of images:
1. **Profile Icon** - Small circular image displayed throughout the app
2. **Background Image** - Banner/header image for profile customization

## Features Implemented

### 1. Database Schema
- **Location**: `supabase/migrations/20260526_add_user_images.sql`
- **Tables Modified**:
  - `profiles`: Added image URL fields and timestamps
  - `user_preferences`: Added display opt-in settings
- **Storage**: Supabase Storage bucket `user-images` with RLS policies

#### New Profile Fields
```sql
profile_icon_url TEXT
background_image_url TEXT
profile_icon_updated_at TIMESTAMPTZ
background_image_updated_at TIMESTAMPTZ
```

#### New User Preferences Fields
```sql
show_profile_icon BOOLEAN DEFAULT true
show_background_image BOOLEAN DEFAULT true
```

### 2. Storage Configuration
- **Bucket Name**: `user-images`
- **Access**: Private (authenticated users only)
- **File Size Limit**: 5MB
- **Allowed Types**: JPEG, JPG, PNG, WebP, GIF
- **File Structure**: `{user_id}/profile-icon.{ext}` and `{user_id}/background.{ext}`

#### Row Level Security (RLS) Policies
1. Users can upload/update/delete their own images
2. Users can always view their own images
3. Profile icons are publicly visible if `show_profile_icon = true`
4. Background images are publicly visible if `show_background_image = true`

### 3. API Endpoints

#### Upload Image
- **Endpoint**: `POST /api/user-images/upload`
- **Location**: `src/routes/api/user-images/upload/+server.ts`
- **Body**: FormData with `file` and `type` fields
- **Response**: `{ url: string, type: string, uploadedAt: string }`
- **Validation**:
  - File type checking
  - File size limit (5MB)
  - Authenticated users only
  - Automatic cleanup of previous image

#### Delete Image
- **Endpoint**: `DELETE /api/user-images/delete`
- **Location**: `src/routes/api/user-images/delete/+server.ts`
- **Body**: JSON with `type` field
- **Response**: `{ success: boolean, type: string, deletedAt: string }`
- **Actions**:
  - Removes file from storage
  - Clears URL from database
  - Updates timestamp

### 4. UI Components

#### ImageUpload Component
- **Location**: `src/lib/components/ImageUpload.svelte`
- **Features**:
  - Drag & drop support
  - Live preview
  - Upload progress indication
  - Change/Delete buttons with overlay
  - Circular mode for profile icons
  - Customizable aspect ratio for backgrounds
  - Error handling and display
  - File validation (type & size)

**Props**:
```typescript
{
  type: 'profile_icon' | 'background_image',
  currentUrl?: string | null,
  title: string,
  description?: string,
  circular?: boolean,
  aspectRatio?: string,
  maxSizeMB?: number
}
```

**Events**:
- `uploaded`: Fired when image is successfully uploaded
- `deleted`: Fired when image is deleted
- `error`: Fired on validation or upload errors

### 5. Profile Page Integration
- **Location**: `src/routes/(protected)/profile/+page.svelte`
- **Additions**:
  - Profile Images section at the top
  - Two ImageUpload components (profile icon and background)
  - Privacy controls in Privacy & Sharing section
  - Reactive binding to current image URLs

### 6. Privacy Controls
Users can control image visibility through checkboxes in the Privacy & Sharing section:
- **Show profile icon publicly**: Controls profile icon visibility
- **Show background image publicly**: Controls background image visibility

Both default to `true` (public) but can be toggled off.

### 7. Backend Updates
Modified server actions to handle new preferences:
- `src/routes/(protected)/profile/+page.server.ts` - `savePrefs` action
- `src/routes/(protected)/settings/+page.server.ts` - settings preferences

## Usage

### For Users
1. Navigate to Profile page
2. Scroll to "Profile Images" section
3. Click or drag & drop to upload images
4. Hover over existing images to change or delete
5. Control visibility in Privacy & Sharing section

### For Developers

#### Displaying User Images
```svelte
<!-- Profile Icon (Circular) -->
{#if userProfile?.profile_icon_url}
  <img 
    src={userProfile.profile_icon_url} 
    alt="Profile" 
    class="w-12 h-12 rounded-full object-cover"
  />
{/if}

<!-- Background Image -->
{#if userProfile?.background_image_url}
  <img 
    src={userProfile.background_image_url} 
    alt="Background" 
    class="w-full h-48 object-cover"
  />
{/if}
```

#### Checking Privacy Settings
```typescript
// In server-side code
const { data: prefs } = await supabase
  .from('user_preferences')
  .select('show_profile_icon, show_background_image')
  .eq('user_id', userId)
  .single();

const canShowIcon = prefs?.show_profile_icon ?? true;
const canShowBackground = prefs?.show_background_image ?? true;
```

#### Using the Helper Function
```sql
-- Get user image URL respecting privacy settings
SELECT public.get_user_image_url(
  'user-uuid-here',
  'profile_icon'  -- or 'background_image'
);
```

## Integration Points

### Where Images Could Be Displayed

1. **Dashboard** - User profile header with background and icon
2. **Leaderboard** - Profile icons next to usernames
3. **Session Details** - Author info with profile icon
4. **User Profile Pages** - Full profile view with background
5. **Comments/Feedback** - Profile icons next to user comments
6. **Analytics Reports** - Header personalization

### Suggested Display Locations

#### High Priority
- **Profile Page Header**: Background image with circular profile icon overlay
- **Leaderboard**: Small circular icons (24-32px) next to display names
- **Navigation**: Circular icon in top-right user menu

#### Medium Priority  
- **Dashboard**: Personalized header with background
- **Session Sharing**: Profile icon when sharing sessions
- **Analytics Reports**: Custom branding with profile images

#### Low Priority
- **Comments**: Profile icons in feedback/comment systems
- **Achievements**: Profile icon in achievement notifications

## File Management

### Automatic Cleanup
- When uploading a new image, the old one is automatically deleted
- Image filenames are fixed based on type to enable easy replacement
- Storage path: `user-images/{user_id}/{type}.{ext}`

### Manual Deletion
- Users can delete images via the UI
- Deletion removes both storage file and database reference
- Timestamps are updated to track changes

## Security Considerations

1. **Authentication**: All endpoints require authenticated users
2. **Authorization**: Users can only modify their own images
3. **File Validation**: Type and size checking before upload
4. **RLS Policies**: Database-level access control
5. **Privacy Controls**: User-controlled visibility settings

## Performance

- **Caching**: Images are cached with 1-hour cache control
- **Optimization**: Recommend users upload optimized images
- **Size Limit**: 5MB prevents excessively large files
- **Upsert**: Files are replaced not duplicated

## Testing Checklist

- [ ] Upload profile icon (circular display confirmed)
- [ ] Upload background image (aspect ratio correct)
- [ ] Change existing images (old files deleted)
- [ ] Delete images (storage and DB cleared)
- [ ] Privacy toggles work correctly
- [ ] File size validation (>5MB rejected)
- [ ] File type validation (non-images rejected)
- [ ] RLS policies prevent unauthorized access
- [ ] Drag & drop functionality works
- [ ] Mobile responsive display
- [ ] Error messages display correctly
- [ ] Page reload after upload shows new image

## Migration Steps

### Running the Migration
```bash
# Apply migration to database
npx supabase db push

# Or manually run the SQL file
psql -U postgres -d your_database -f supabase/migrations/20260526_add_user_images.sql
```

### Post-Migration
1. Verify storage bucket created: `user-images`
2. Check RLS policies applied correctly
3. Test upload with a user account
4. Verify privacy controls work

## Future Enhancements

### Potential Additions
1. **Image Cropping**: Built-in crop tool before upload
2. **Image Optimization**: Server-side compression/resizing
3. **Multiple Sizes**: Generate thumbnails automatically
4. **Image Filters**: Apply effects (grayscale, sepia, etc.)
5. **Default Avatars**: Fallback images with user initials
6. **CDN Integration**: Serve images through CDN for performance
7. **Analytics**: Track image usage and engagement
8. **Moderation**: Admin tools to review/remove inappropriate images

### Technical Improvements
1. Update TypeScript database types after running migration
2. Add image preview before upload
3. Implement progressive loading for large images
4. Add image metadata (dimensions, file size)
5. Batch operations for multiple image management

## Support

For issues or questions:
- Check browser console for errors
- Verify Supabase storage permissions
- Ensure migration ran successfully
- Check file size and type restrictions

## Version History

- **v1.0** (2026-05-26): Initial implementation
  - Profile icon and background image upload
  - Privacy controls
  - Image management UI
  - Storage bucket with RLS policies
