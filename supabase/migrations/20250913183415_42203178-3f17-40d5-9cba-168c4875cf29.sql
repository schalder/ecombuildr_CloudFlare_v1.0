-- Create bucket for transformed images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images-transformed', 'images-transformed', true);

-- Create RLS policy for public read access to transformed images
CREATE POLICY "Public read access for transformed images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images-transformed');

-- Create RLS policy for service role to write transformed images
CREATE POLICY "Service role can insert transformed images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images-transformed' AND auth.role() = 'service_role');