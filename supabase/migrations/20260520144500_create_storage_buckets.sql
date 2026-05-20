
-- Create a public bucket for chat attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat_attachments', 'chat_attachments', true, 104857600, '{image/*,audio/*,video/*,application/pdf}')
ON CONFLICT (id) DO NOTHING;

-- Set up access policies for the bucket
-- Allow public access to read files
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat_attachments');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat_attachments' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

-- Allow users to delete their own files
CREATE POLICY "Owner Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat_attachments' 
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );
