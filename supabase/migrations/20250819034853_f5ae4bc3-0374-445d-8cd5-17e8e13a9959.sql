-- Update RLS policies for images bucket to scope files by user
-- First, drop existing policies if any
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own images" ON storage.objects;

-- Allow public read access to all images (for display on websites)
CREATE POLICY "Allow public to view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow authenticated users to upload images to their own folder (prefixed by user ID)
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own images
CREATE POLICY "Allow users to view own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own images
CREATE POLICY "Allow users to update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Allow users to delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);