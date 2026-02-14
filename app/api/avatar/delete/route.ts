import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

export async function DELETE(request: NextRequest) {
  try {
    // Get URLs from request body
    const body = await request.json();
    const { profileImage, thumbnailImage } = body;

    if (!profileImage || !thumbnailImage) {
      return NextResponse.json(
        { error: 'Image URLs are required' },
        { status: 400 }
      );
    }

    // Delete both images from Vercel Blob
    try {
      await Promise.all([
        del(profileImage),
        del(thumbnailImage),
      ]);
    } catch (deleteError) {
      // Images may not exist or already be deleted, continue anyway
      console.warn('Error deleting blobs:', deleteError);
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete avatar' },
      { status: 500 }
    );
  }
}
