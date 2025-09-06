import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const defaultSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET_NAME = 'user-videos';
const URL_EXPIRY_DAYS = 7;

/**
 * Upload a video file to Supabase storage.
 * 
 * @param userId - The ID of the user uploading the video
 * @param file - The video file to upload
 * @returns Object containing the video URL and storage path
 */
export async function uploadVideo(
  userId: string,
  file: File | Blob,
  client: typeof defaultSupabase = defaultSupabase
): Promise<{ url: string; path: string }> {
  // Generate a unique filename
  const date = new Date().toISOString().split('T')[0];
  const filename = `${uuidv4()}.mp4`;
  const path = `${userId}/${date}/${filename}`;
  
  // Upload the file
  const { error: uploadError } = await client.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  if (uploadError) {
    throw new Error(`Failed to upload video: ${uploadError.message}`);
  }
  
  // Get a signed URL
  const { data: { signedUrl }, error: urlError } = await client.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, URL_EXPIRY_DAYS * 24 * 60 * 60);
    
  if (urlError || !signedUrl) {
    throw new Error(`Failed to generate signed URL: ${urlError?.message}`);
  }
  
  return {
    url: signedUrl,
    path
  };
}

/**
 * Delete a video file from Supabase storage.
 * 
 * @param path - The storage path of the video to delete
 */
export async function deleteVideo(path: string, client: typeof defaultSupabase = defaultSupabase): Promise<void> {
  const { error } = await client.storage
    .from(BUCKET_NAME)
    .remove([path]);
    
  if (error) {
    throw new Error(`Failed to delete video: ${error.message}`);
  }
} 