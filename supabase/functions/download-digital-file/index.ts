import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DownloadRequest {
  orderId: string;
  filePath: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (req.method !== 'GET') {
      throw new Error('Method not allowed');
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    const filePath = url.searchParams.get('filePath');
    const token = url.searchParams.get('token');

    if (!orderId || !filePath || !token) {
      throw new Error('Missing required parameters');
    }

    // Verify order access token
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, custom_fields')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    const orderAccessToken = order.custom_fields?.order_access_token;
    if (!orderAccessToken || orderAccessToken !== token) {
      throw new Error('Invalid access token');
    }

    // Check download link validity
    const { data: downloadLink, error: linkError } = await supabase
      .from('order_download_links')
      .select('*')
      .eq('order_id', orderId)
      .eq('digital_file_path', filePath)
      .single();

    if (linkError || !downloadLink) {
      throw new Error('Download link not found');
    }

    // Check if download limit exceeded
    if (downloadLink.download_count >= downloadLink.max_downloads) {
      throw new Error('Download limit exceeded');
    }

    // Check if link has expired
    if (new Date(downloadLink.expires_at) < new Date()) {
      throw new Error('Download link has expired');
    }

    // Get the file from storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('digital-products')
      .download(filePath);

    if (storageError || !fileData) {
      throw new Error('File not found or inaccessible');
    }

    // Update download count
    await supabase
      .from('order_download_links')
      .update({ 
        download_count: downloadLink.download_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', downloadLink.id);

    // Get file metadata
    const fileName = filePath.split('/').pop() || 'download';
    
    // Return the file with proper headers
    return new Response(fileData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error: any) {
    console.error('Error in download-digital-file function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);