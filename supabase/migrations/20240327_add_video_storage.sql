-- Add video_url column to sessions table if it doesn't exist
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Create storage policy to allow public to view videos
CREATE POLICY "Public can view videos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'videos');

-- Create storage policy to allow users to delete their own videos
CREATE POLICY "Users can delete own videos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]); 