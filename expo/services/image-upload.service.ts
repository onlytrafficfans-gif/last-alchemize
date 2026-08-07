/**
 * Automatic image compression and Supabase Storage upload.
 *
 * Flow:
 * 1. Accept a file (from expo-image-picker or similar)
 * 2. Compress: resize to max 1600px, convert to JPEG/WebP at 0.75 quality
 * 3. Upload to Supabase Storage under users/{userId}/uploads/{timestamp}-{safeFilename}
 * 4. Return the public URL and metadata
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { decode as base64Decode } from 'base64-arraybuffer';
import { getSupabase, getSupabaseUserId, logSupabaseOp } from '@/lib/supabase';

const MAX_DIMENSION = 1600;
const COMPRESSION_QUALITY = 0.75;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB reject threshold before compression
const BUCKET = 'user-uploads';

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

export interface UploadResult {
  success: boolean;
  error?: string;
  path?: string;
  metadata?: CompressedImage;
}

/**
 * Sanitize a filename for storage. compressImageBeforeUpload() always converts
 * output to JPEG (SaveFormat.JPEG), so the stored filename must always end in
 * .jpg regardless of the original file's extension — otherwise the filename
 * (e.g. photo.png) would mismatch the actual uploaded bytes/content-type
 * (image/jpeg).
 */
function safeFilename(originalName: string): string {
  const base = originalName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);
  return `${base || 'image'}.jpg`;
}

/**
 * Compress an image before upload.
 *
 * @param fileUri - The local file URI (from image picker or camera)
 * @param fileName - Original filename for safe naming
 * @returns CompressedImage with metadata, or throws on failure
 */
export async function compressImageBeforeUpload(
  fileUri: string,
  fileName: string = 'image.jpg'
): Promise<CompressedImage> {
  console.log('[ImageUpload] Starting compression for:', fileName);

  // Get original file info
  let originalSize = 0;
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists && fileInfo.size) {
      originalSize = fileInfo.size;
    }
  } catch {
    console.warn('[ImageUpload] Could not get original file size');
  }

  // Reject files over max size before compression
  if (originalSize > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File is too large (${(originalSize / 1024 / 1024).toFixed(1)} MB). Maximum allowed is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`
    );
  }

  // Compress with expo-image-manipulator
  const result = await manipulateAsync(
    fileUri,
    [
      {
        resize: {
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
        },
      },
    ],
    {
      compress: COMPRESSION_QUALITY,
      format: SaveFormat.JPEG,
    }
  );

  // Get compressed file size
  let compressedSize = 0;
  try {
    const compressedInfo = await FileSystem.getInfoAsync(result.uri);
    if (compressedInfo.exists && compressedInfo.size) {
      compressedSize = compressedInfo.size;
    }
  } catch {
    console.warn('[ImageUpload] Could not get compressed file size');
  }

  const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;

  console.log(
    `[ImageUpload] Compressed: ${(originalSize / 1024).toFixed(1)} KB → ${(compressedSize / 1024).toFixed(1)} KB (${(compressionRatio * 100).toFixed(0)}%)`
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    mimeType: 'image/jpeg',
    originalSize,
    compressedSize,
    compressionRatio,
  };
}

/**
 * Upload a compressed image to Supabase Storage.
 *
 * @param compressedImage - Result from compressImageBeforeUpload()
 * @param fileName - Original filename for path construction
 * @returns UploadResult with storage path on success (not the signed URL)
 */
export async function uploadImageToSupabase(
  compressedImage: CompressedImage,
  fileName: string = 'image.jpg'
): Promise<UploadResult> {
  let tempFileUri: string | null = null;

  try {
    const userId = getSupabaseUserId();
    const supabase = getSupabase();
    const timestamp = Date.now();
    const safeName = safeFilename(fileName);
    const storagePath = `users/${userId}/uploads/${timestamp}-${safeName}`;

    console.log('[ImageUpload] Uploading to:', storagePath);

    // Validate MIME type strictly
    if (compressedImage.mimeType !== 'image/jpeg') {
      throw new Error(`Invalid MIME type. Expected image/jpeg, got ${compressedImage.mimeType}`);
    }

    tempFileUri = compressedImage.uri;

    // Read the compressed file as base64 and decode to ArrayBuffer
    const base64 = await FileSystem.readAsStringAsync(compressedImage.uri, {
      encoding: 'base64' as const,
    });

    const arrayBuffer = base64Decode(base64);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    logSupabaseOp('STORAGE_UPLOAD', BUCKET, { error }, `path=${storagePath}`);

    if (error) throw error;

    // Return only the path. The signed URL should be generated on-demand by the client
    // when the image needs to be displayed, not stored or cached in the app.
    return {
      success: true,
      path: storagePath,
      metadata: compressedImage,
    };
  } catch (error: any) {
    console.error('[ImageUpload] Upload failed:', error?.message || error);
    return {
      success: false,
      error: error?.message || 'Failed to upload image',
    };
  } finally {
    // Clean up temporary compressed file
    if (tempFileUri) {
      try {
        await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
        console.log('[ImageUpload] Cleaned up temporary file');
      } catch (cleanupError) {
        console.warn('[ImageUpload] Failed to clean up temporary file:', cleanupError);
      }
    }
  }
}

/**
 * Full pipeline: compress then upload.
 * This is the main entry point for image handling.
 */
export async function compressAndUpload(
  fileUri: string,
  fileName: string = 'image.jpg'
): Promise<UploadResult> {
  try {
    const compressed = await compressImageBeforeUpload(fileUri, fileName);
    return await uploadImageToSupabase(compressed, fileName);
  } catch (error: any) {
    console.error('[ImageUpload] Pipeline failed:', error?.message || error);
    return {
      success: false,
      error: error?.message || 'Image upload failed',
    };
  }
}

/**
 * Generate a short-lived signed URL for displaying an image.
 * Call this when you need to display an image, not when storing it.
 *
 * @param storagePath - The path returned from uploadImageToSupabase()
 * @returns Signed URL for display, or error
 */
export async function getImageSignedUrl(storagePath: string): Promise<string> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

    if (error) throw error;

    return data.signedUrl;
  } catch (error: any) {
    console.error('[ImageUpload] Failed to generate signed URL:', error?.message || error);
    throw new Error('Failed to generate image URL');
  }
}

/**
 * Delete an image from storage.
 * Used during account deletion or when user removes an image.
 *
 * @param storagePath - The path of the image to delete
 * @returns true on success, throws on error
 */
export async function deleteImage(storagePath: string): Promise<boolean> {
  try {
    const supabase = getSupabase();

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);

    if (error) throw error;

    console.log('[ImageUpload] Deleted image:', storagePath);
    return true;
  } catch (error: any) {
    console.error('[ImageUpload] Failed to delete image:', error?.message || error);
    throw new Error('Failed to delete image');
  }
}
