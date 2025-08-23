import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LowStockEmailRequest {
  store_id: string;
  product_id: string;
  threshold?: number;
}

serve(async (req: Request) => {
  console.log("=== Low Stock Email Function Started ===");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody: LowStockEmailRequest = await req.json();
    console.log("Request body:", requestBody);

    const { store_id, product_id, threshold = 5 } = requestBody;

    if (!store_id || !product_id) {
      throw new Error('Missing required fields: store_id and product_id');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch store and product details
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        owner_id,
        settings,
        profiles!stores_owner_id_fkey(email, full_name)
      `)
      .eq('id', store_id)
      .single();

    if (storeError || !storeData) {
      throw new Error(`Store not found: ${storeError?.message}`);
    }

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, name, sku, inventory_quantity, track_inventory')
      .eq('id', product_id)
      .eq('store_id', store_id)
      .single();

    if (productError || !productData) {
      throw new Error(`Product not found: ${productError?.message}`);
    }

    // Check if low stock alerts are enabled
    const emailSettings = storeData.settings?.email_notifications || {};
    if (!emailSettings.low_stock) {
      console.log('Low stock email notifications are disabled for this store');
      return new Response(
        JSON.stringify({ success: true, message: 'Low stock notifications disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if product actually has low stock
    const actualThreshold = storeData.settings?.email_notifications?.low_stock_threshold || threshold;
    if (!productData.track_inventory || productData.inventory_quantity > actualThreshold) {
      console.log(`Product ${productData.name} is not low stock (${productData.inventory_quantity} > ${actualThreshold})`);
      return new Response(
        JSON.stringify({ success: true, message: 'Product is not low stock' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get owner email
    const ownerEmail = storeData.profiles?.email;
    const ownerName = storeData.profiles?.full_name || 'Store Owner';
    
    if (!ownerEmail) {
      throw new Error('Store owner email not found');
    }

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@ecombuildr.com';
    const fromName = Deno.env.get('RESEND_FROM_NAME') || 'EcomBuildr';

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(resendApiKey);

    const emailSubject = `⚠️ Low Stock Alert: ${productData.name}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <h1 style="color: #856404; margin: 0 0 10px 0; font-size: 24px;">⚠️ Low Stock Alert</h1>
          <p style="color: #856404; margin: 0; font-size: 16px;">Your product inventory is running low!</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; color: #333;">Product Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold;">Product:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${productData.name}</td>
            </tr>
            ${productData.sku ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold;">SKU:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${productData.sku}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold;">Current Stock:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #dc3545; font-weight: bold;">${productData.inventory_quantity} units</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Alert Threshold:</td>
              <td style="padding: 8px 0;">${actualThreshold} units</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 0; color: #0c5460;">
            <strong>Action Required:</strong> Consider restocking this product to avoid stockouts and lost sales.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://ecombuildr.com/dashboard/products/edit/${product_id}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Update Product Stock
          </a>
        </div>

        <div style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 30px;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            You're receiving this alert because low stock notifications are enabled for ${storeData.name}.
            <br>
            <a href="https://ecombuildr.com/dashboard/settings/store" style="color: #007bff;">Manage notification settings</a>
          </p>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [ownerEmail],
      subject: emailSubject,
      html: emailBody,
    });

    console.log('Low stock email sent successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Low stock alert sent for ${productData.name}`,
        message_id: result.data?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Low stock email error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send low stock email' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});