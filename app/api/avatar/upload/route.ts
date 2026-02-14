import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const PROFILE_SIZE = 512;
const THUMBNAIL_SIZE = 128;

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const uniqueId = uuidv4();
    const baseFilename = `avatars/${userId}/${uniqueId}`;

    // Process profile image (512x512)
    const profileImage = await sharp(buffer)
      .rotate() // Auto-orient based on EXIF
      .resize(PROFILE_SIZE, PROFILE_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 }) // Convert to WebP and strip metadata
      .toBuffer();

    // Process thumbnail (128x128)
    const thumbnailImage = await sharp(buffer)
      .rotate() // Auto-orient based on EXIF
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 }) // Convert to WebP and strip metadata
      .toBuffer();

    // Upload to Vercel Blob
    const [profileBlob, thumbnailBlob] = await Promise.all([
      put(`${baseFilename}.webp`, profileImage, {
        access: 'public',
        contentType: 'image/webp',
        addRandomSuffix: false,
      }),
      put(`${baseFilename}_thumb.webp`, thumbnailImage, {
        access: 'public',
        contentType: 'image/webp',
        addRandomSuffix: false,
      }),
    ]);

    return NextResponse.json({
      success: true,
      profileImage: profileBlob.url,
      thumbnailImage: thumbnailBlob.url,
    });
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
