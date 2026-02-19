/**
 * Client-side image compression using Canvas API.
 * Handles large iPhone photos (HEIC/HEIF/JPEG/PNG) by resizing
 * and compressing them before upload.
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  mimeType: 'image/jpeg',
};

/**
 * Compresses an image file client-side using the Canvas API.
 * - Resizes to fit within maxWidth/maxHeight while preserving aspect ratio
 * - Converts to JPEG at specified quality
 * - Handles HEIC and other iPhone formats via browser decoding
 * - Returns a base64 data URL string
 */
export async function compressImage(
  file: File,
  options?: CompressOptions
): Promise<string> {
  const { maxWidth, maxHeight, quality, mimeType } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if exceeds max dimensions, preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw with white background (for transparent PNGs converted to JPEG)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL(mimeType, quality);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image. The file may be corrupted or in an unsupported format.'));
    };

    img.src = url;
  });
}

/**
 * Compresses an image for avatar use (smaller dimensions, higher quality).
 */
export async function compressAvatar(file: File): Promise<string> {
  return compressImage(file, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.85,
    mimeType: 'image/jpeg',
  });
}

/**
 * Compresses an image for avatar thumbnail.
 */
export async function compressAvatarThumb(file: File): Promise<string> {
  return compressImage(file, {
    maxWidth: 128,
    maxHeight: 128,
    quality: 0.8,
    mimeType: 'image/jpeg',
  });
}

/**
 * Validates that a file is an image.
 */
export function isValidImageFile(file: File): boolean {
  return file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
}

/**
 * Max raw file size to accept before compression (50MB).
 * This is generous because we compress it down significantly.
 */
export const MAX_RAW_FILE_SIZE = 50 * 1024 * 1024;
