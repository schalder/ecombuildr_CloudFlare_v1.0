import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Cache headers for optimized performance
const cacheHeaders = {
  'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
  'Vary': 'Accept',
};

// Initialize Supabase client for storage operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Generate deterministic cache key for transformed images
function generateCacheKey(originalUrl: string, format: string, width?: number, height?: number, quality?: number): string {
  const url = new URL(originalUrl);
  const filename = url.pathname.split('/').pop() || 'image';
  const nameWithoutExt = filename.split('.')[0];
  
  const params = [];
  if (width) params.push(`w${width}`);
  if (height) params.push(`h${height}`);
  params.push(`${format}`);
  if (quality && quality !== 85) params.push(`q${quality}`);
  
  return `${nameWithoutExt}_${params.join('_')}.${format}`;
}

// Check if transformed image exists in storage
async function getTransformedImage(cacheKey: string) {
  try {
    const { data, error } = await supabase.storage
      .from('images-transformed')
      .download(cacheKey);
    
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// Save transformed image to storage
async function saveTransformedImage(cacheKey: string, buffer: ArrayBuffer, contentType: string) {
  try {
    const { error } = await supabase.storage
      .from('images-transformed')
      .upload(cacheKey, new Uint8Array(buffer), {
        contentType,
        cacheControl: '31536000', // 1 year
      });
    
    if (error) {
      console.warn('Failed to save transformed image:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('Error saving transformed image:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    
    const imageUrl = params.get('url');
    const format = params.get('format') || 'webp';
    const width = params.get('w') ? parseInt(params.get('w')!) : undefined;
    const height = params.get('h') ? parseInt(params.get('h')!) : undefined;
    const quality = params.get('q') ? parseInt(params.get('q')!) : 85;

    if (!imageUrl) {
      return new Response('Missing url parameter', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log('Transforming image:', { imageUrl, format, width, height, quality });

    // Generate cache key for this transformation
    const cacheKey = generateCacheKey(imageUrl, format, width, height, quality);
    console.log('Cache key:', cacheKey);

    // Check if transformed image already exists
    const existingImage = await getTransformedImage(cacheKey);
    if (existingImage) {
      console.log('Serving from cache:', cacheKey);
      
      // Redirect to the cached version for better CDN performance
      const cachedUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/images-transformed/${cacheKey}`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': cachedUrl,
        },
      });
    }

    // Fetch the original image
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const originalBuffer = await imageResponse.arrayBuffer();
    
    // Check if we can process this format
    const contentType = imageResponse.headers.get('content-type') || '';
    const isProcessableImage = contentType.includes('image/') && 
      (contentType.includes('jpeg') || contentType.includes('jpg') || 
       contentType.includes('png') || contentType.includes('webp'));

    // If it's not a processable image or already in the desired format, return as-is
    if (!isProcessableImage || (format === 'original')) {
      return new Response(originalBuffer, {
        headers: {
          ...corsHeaders,
          ...cacheHeaders,
          'Content-Type': contentType,
        },
      });
    }

    // Use Deno's built-in image processing
    let processedBuffer: ArrayBuffer;
    let outputContentType: string;

    try {
      // Convert image using Canvas API (available in Deno Deploy)
      const blob = new Blob([originalBuffer], { type: contentType });
      const bitmap = await createImageBitmap(blob);
      
      // Calculate dimensions - preserve original if no width/height specified
      let targetWidth = bitmap.width;
      let targetHeight = bitmap.height;
      
      // Only resize if width or height is explicitly provided
      if (width || height) {
        if (width && height) {
          // Both dimensions provided - use them directly
          targetWidth = width;
          targetHeight = height;
        } else if (width) {
          // Only width provided - maintain aspect ratio
          const aspectRatio = bitmap.height / bitmap.width;
          targetWidth = width;
          targetHeight = Math.round(width * aspectRatio);
        } else if (height) {
          // Only height provided - maintain aspect ratio
          const aspectRatio = bitmap.width / bitmap.height;
          targetHeight = height;
          targetWidth = Math.round(height * aspectRatio);
        }
      }
      
      // Create canvas with calculated dimensions
      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d')!;
      
      // Draw image (resize only if dimensions changed)
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      
      // Convert to desired format
      let mimeType: string;
      switch (format.toLowerCase()) {
        case 'webp':
          mimeType = 'image/webp';
          break;
        case 'avif':
          mimeType = 'image/avif';
          break;
        case 'jpeg':
        case 'jpg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        default:
          mimeType = 'image/webp'; // Default to WebP
      }

      const convertedBlob = await canvas.convertToBlob({
        type: mimeType,
        quality: quality / 100,
      });
      
      processedBuffer = await convertedBlob.arrayBuffer();
      outputContentType = mimeType;
      
      console.log('Image processed successfully:', {
        originalSize: originalBuffer.byteLength,
        processedSize: processedBuffer.byteLength,
        compressionRatio: ((1 - processedBuffer.byteLength / originalBuffer.byteLength) * 100).toFixed(1) + '%',
        cacheKey
      });

      // Save the transformed image to storage for future requests
      await saveTransformedImage(cacheKey, processedBuffer, outputContentType);

    } catch (processError) {
      console.warn('Image processing failed, returning original:', processError);
      // Fallback to original image if processing fails
      processedBuffer = originalBuffer;
      outputContentType = contentType;
    }

    return new Response(processedBuffer, {
      headers: {
        ...corsHeaders,
        ...cacheHeaders,
        'Content-Type': outputContentType,
      },
    });

  } catch (error) {
    console.error('Error in image-transform function:', error);
    return new Response(`Error processing image: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});