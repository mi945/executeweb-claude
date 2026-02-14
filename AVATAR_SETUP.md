# Profile Photo Upload - Setup Instructions

## Overview
Users can now upload profile photos with automatic image processing, optimization, and CDN delivery via Vercel Blob storage.

## Features Implemented
- ✅ Upload profile photos (JPG, PNG, WebP) up to 5MB
- ✅ Automatic image processing:
  - Auto-orientation based on EXIF data
  - Metadata stripping for privacy
  - 512x512 profile image generation
  - 128x128 thumbnail generation
  - WebP conversion for optimal file size
- ✅ Thumbnails used in lists/feeds for performance
- ✅ Remove photo option
- ✅ Immediate preview on file selection
- ✅ Clear error messages for validation failures
- ✅ Cache-busting with UUID filenames
- ✅ Gradient avatar fallback

## Setup Required

### 1. Create Vercel Blob Store
1. Go to https://vercel.com/dashboard/stores
2. Create a new Blob store (if you don't have one)
3. Copy the `BLOB_READ_WRITE_TOKEN`

### 2. Set Environment Variable
Create a `.env.local` file in the project root:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxxxxxxxxxxxxxx
```

### 3. Restart the Development Server
```bash
npm run dev
```

## Database Schema Updates
The `profiles` table now includes:
- `profileImage` - Full size profile image URL (512x512)
- `profileImageThumb` - Thumbnail URL (128x128)
- `avatarColor` - Gradient color fallback

## API Endpoints

### POST /api/avatar/upload
Uploads and processes profile photo.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `file`: Image file (jpg/png/webp, max 5MB)
  - `userId`: User ID

**Response:**
```json
{
  "success": true,
  "profileImage": "https://...",
  "thumbnailImage": "https://..."
}
```

### DELETE /api/avatar/delete
Removes profile photo from storage.

**Request:**
- Method: DELETE
- Content-Type: application/json
- Body:
  ```json
  {
    "profileImage": "https://...",
    "thumbnailImage": "https://..."
  }
  ```

**Response:**
```json
{
  "success": true,
  "message": "Avatar deleted successfully"
}
```

## File Locations

### API Routes
- `/app/api/avatar/upload/route.ts` - Upload handler
- `/app/api/avatar/delete/route.ts` - Delete handler

### Components Updated
- `/app/profile/page.tsx` - Profile edit page with upload UI
- `/app/profile/[id]/page.tsx` - Public profile view
- `/components/UserProfile.tsx` - Sidebar profile widget
- `/components/CreatorMetadata.tsx` - Task creator display
- `/components/WallOfFame.tsx` - Recent completers
- `/components/TaskComments.tsx` - Comment avatars

### Database Schema
- `/lib/db.ts` - Updated profiles entity

## Security Features
- File type validation (jpg/png/webp only)
- File size validation (5MB max)
- User can only upload/delete their own avatar
- Metadata stripped from uploaded images
- Public blob URLs with automatic CDN caching

## Storage Structure
```
avatars/
  {userId}/
    {uuid}.webp           # Profile image (512x512)
    {uuid}_thumb.webp     # Thumbnail (128x128)
```

## Testing Checklist
- [ ] Valid image upload works (jpg/png/webp under 5MB)
- [ ] Invalid file type rejected with error
- [ ] File over 5MB rejected with error
- [ ] Thumbnails displayed in lists/feeds
- [ ] Full image displayed on profile page
- [ ] Avatar appears in all locations after upload
- [ ] Remove photo reverts to gradient avatar
- [ ] Preview shows immediately on file select
- [ ] Cache-busting works (UUID filenames)
- [ ] Only user can modify their own avatar

## Troubleshooting

### Upload fails with "BLOB_READ_WRITE_TOKEN not found"
- Make sure `.env.local` exists with the correct token
- Restart the dev server after adding the variable

### Images don't appear after upload
- Check browser console for CORS errors
- Verify Vercel Blob store is public
- Clear browser cache

### Upload hangs or timeouts
- Check image file size (max 5MB)
- Verify sharp library is installed correctly

## Dependencies
- `sharp` - Image processing
- `@vercel/blob` - Object storage
- `uuid` - Unique filename generation
