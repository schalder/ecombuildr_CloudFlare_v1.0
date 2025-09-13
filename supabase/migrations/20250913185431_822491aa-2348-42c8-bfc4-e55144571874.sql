-- Create images-transformed bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images-transformed', 'images-transformed', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for images-transformed bucket
CREATE POLICY "Images transformed are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'images-transformed');

CREATE POLICY "Service role can upload transformed images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'images-transformed' AND auth.role() = 'service_role');

CREATE POLICY "Service role can update transformed images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'images-transformed' AND auth.role() = 'service_role');