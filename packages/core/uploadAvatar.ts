import { supabase } from "./supabase-client";

/** Uploads image, returns public URL */
export async function uploadAvatar(file: Blob, userId: string): Promise<string> {
  const path = `avatars/${userId}.jpg`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { cacheControl: "3600", upsert: true });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
} 