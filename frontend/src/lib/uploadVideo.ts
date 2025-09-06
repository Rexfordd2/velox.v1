import { supabase } from './supabase'

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export async function uploadVideo(file: File, userId: string): Promise<string> {
  // Validate file type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // Validate file size
  if (file.size === 0) {
    throw new Error('File is empty');
  }

  const fileName = `${userId}/${Date.now()}-${file.name}`
  const filePath = `exercise-videos/${fileName}`

  if (!supabase) throw new Error('Storage not configured')
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw error
  }

  const { data: pub } = await supabase.storage
    .from('videos')
    .getPublicUrl(filePath)

  return pub.publicUrl
} 