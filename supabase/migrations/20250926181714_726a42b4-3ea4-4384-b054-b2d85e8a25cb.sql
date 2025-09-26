-- Create digital-products storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'digital-products',
  'digital-products', 
  false,
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-rar',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
);

-- RLS policies for digital-products bucket
CREATE POLICY "Store owners can view their digital product files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'digital-products' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM public.stores 
    WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can upload their digital product files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'digital-products' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM public.stores 
    WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update their digital product files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'digital-products' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM public.stores 
    WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can delete their digital product files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'digital-products' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM public.stores 
    WHERE owner_id = auth.uid()
  )
);