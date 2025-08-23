
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  order_id: string;
  store_id: string;
  website_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { order_id, store_id, website_id }: EmailRequest = await req.json()

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          quantity,
          price,
          total
        )
      `)
      .eq('id', order_id)
      .single()

    if (orderError) {
      throw new Error(`Failed to fetch order: ${orderError.message}`)
    }

    // Get store details and owner email
    const { data: store, error: storeError } = await supabaseClient
      .from('stores')
      .select(`
        *,
        profiles!stores_owner_id_fkey (
          email,
          full_name
        )
      `)
      .eq('id', store_id)
      .single()

    if (storeError) {
      throw new Error(`Failed to fetch store: ${storeError.message}`)
    }

    // Get website details if website_id is provided
    let websiteName = store.name
    if (website_id) {
      const { data: website } = await supabaseClient
        .from('websites')
        .select('name')
        .eq('id', website_id)
        .single()
      
      if (website) {
        websiteName = website.name
      }
    }

    const ownerEmail = store.profiles.email
    const ownerName = store.profiles.full_name || 'Store Owner'

    // Calculate order totals
    const itemsTotal = order.order_items.reduce((sum: number, item: any) => sum + Number(item.total), 0)
    const orderTotal = Number(order.total)

    // Create email content
    const emailSubject = `New Order #${order.order_number} - ${websiteName}`
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Order Received!</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <p><strong>Website:</strong> ${websiteName}</p>
          <p><strong>Customer:</strong> ${order.customer_name}</p>
          <p><strong>Email:</strong> ${order.customer_email}</p>
          <p><strong>Phone:</strong> ${order.customer_phone || 'N/A'}</p>
          <p><strong>Total Amount:</strong> ৳${orderTotal.toFixed(2)}</p>
          <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Order Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #e9ecef;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Qty</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.order_items.map((item: any) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${item.product_name}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">৳${Number(item.price).toFixed(2)}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">৳${Number(item.total).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Shipping Address:</strong></p>
          <p style="margin: 5px 0;">${order.shipping_address || 'N/A'}</p>
          <p style="margin: 5px 0;">${order.shipping_city || ''} ${order.shipping_area || ''}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://fhqwacmokbtbspkxjixf.supabase.co/dashboard/orders" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Order in Dashboard
          </a>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px; text-align: center;">
          This is an automated notification from your ${websiteName} website.
        </p>
      </div>
    `

    // Send email using a simple SMTP service (you'll need to configure SMTP settings)
    // For now, we'll use a webhook to an external email service
    const emailServiceUrl = Deno.env.get('EMAIL_SERVICE_URL')
    const emailApiKey = Deno.env.get('EMAIL_API_KEY')

    if (emailServiceUrl && emailApiKey) {
      const emailResponse = await fetch(emailServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${emailApiKey}`
        },
        body: JSON.stringify({
          to: ownerEmail,
          subject: emailSubject,
          html: emailHtml,
          from: 'noreply@yourdomain.com'
        })
      })

      if (!emailResponse.ok) {
        throw new Error(`Failed to send email: ${emailResponse.statusText}`)
      }
    }

    // Log the email notification (you can also store this in a notifications table)
    console.log(`Email notification sent to ${ownerEmail} for order ${order.order_number}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification sent successfully',
        order_number: order.order_number
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending email notification:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
