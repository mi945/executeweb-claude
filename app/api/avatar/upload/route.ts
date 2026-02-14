import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const PROFILE_SIZE = 512;
const THUMBNAIL_SIZE = 128;

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
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

    // Process profile image (512x512)
    const profileImage = await sharp(buffer)
      .rotate() // Auto-orient based on EXIF
      .resize(PROFILE_SIZE, PROFILE_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 }) // Convert to JPEG and strip metadata
      .toBuffer();

    // Process thumbnail (128x128)
    const thumbnailImage = await sharp(buffer)
      .rotate() // Auto-orient based on EXIF
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 }) // Convert to JPEG and strip metadata
      .toBuffer();

    // Convert to base64
    const profileImageBase64 = `data:image/jpeg;base64,${profileImage.toString('base64')}`;
    const thumbnailImageBase64 = `data:image/jpeg;base64,${thumbnailImage.toString('base64')}`;

    return NextResponse.json({
      success: true,
      profileImage: profileImageBase64,
      thumbnailImage: thumbnailImageBase64,
    });
  } catch (error: any) {
    console.error('Error processing avatar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process avatar' },
      { status: 500 }
    );
  }
}
