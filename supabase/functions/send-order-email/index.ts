
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  order_id?: string;
  store_id: string;
  website_id?: string;
  event_type: 'new_order' | 'payment_received' | 'order_cancelled' | 'test';
  test_email?: string;
  use_debug?: boolean;
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

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@yourdomain.com'
    const fromName = Deno.env.get('RESEND_FROM_NAME') || 'Your Store'

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const resend = new Resend(resendApiKey)

    const { order_id, store_id, website_id, event_type, test_email, use_debug }: EmailRequest = await req.json()

    // Validate required fields
    if (!store_id || !event_type) {
      throw new Error('store_id and event_type are required')
    }

    if (event_type !== 'test' && !order_id) {
      throw new Error('order_id is required for non-test events')
    }

    // Get store details and owner email first
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

    // Check email notification settings
    const emailSettings = store.settings?.email_notifications || {}
    const isEnabled = emailSettings[event_type] !== false // Default to true if not explicitly disabled

    if (!isEnabled && event_type !== 'test') {
      console.log(`Email notifications disabled for ${event_type}`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email notifications disabled for ${event_type}`,
          skipped: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const ownerEmail = store.profiles.email
    const ownerName = store.profiles.full_name || 'Store Owner'

    let order = null
    if (event_type !== 'test') {
      // Get order details
      const { data: orderData, error: orderError } = await supabaseClient
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
      order = orderData
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

    // Handle test email
    if (event_type === 'test') {
      const testRecipient = test_email || ownerEmail
      console.log('Sending test email to:', testRecipient)
      console.log('Use debug mode:', use_debug)
      console.log('RESEND_FROM_EMAIL:', Deno.env.get('RESEND_FROM_EMAIL'))
      console.log('RESEND_FROM_NAME:', Deno.env.get('RESEND_FROM_NAME'))
      
      try {
        const debugFromEmail = use_debug ? 'onboarding@resend.dev' : fromEmail
        const testFromName = fromName || 'Your Store'
        
        console.log('Attempting to send with from:', `${testFromName} <${debugFromEmail}>`)
        
        const emailSubject = `Test Email from ${websiteName}`
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Test Successful!</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p>This is a test email from your <strong>${websiteName}</strong> notification system.</p>
              <p>Your email notifications are working correctly!</p>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Test Details:</strong></p>
              <p>From: ${testFromName} &lt;${debugFromEmail}&gt;</p>
              <p>Debug mode: ${use_debug ? 'Yes' : 'No'}</p>
              <p>Sent at: ${new Date().toISOString()}</p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px; text-align: center;">
              This is a test email from your ${websiteName} notification system.
            </p>
          </div>
        `

        const emailResponse = await resend.emails.send({
          from: `${testFromName} <${debugFromEmail}>`,
          to: [testRecipient],
          subject: emailSubject,
          html: emailHtml
        })

        console.log('Test email sent successfully:', emailResponse)
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Test email sent successfully',
            recipient: testRecipient,
            from: `${testFromName} <${debugFromEmail}>`,
            debug_mode: use_debug,
            data: emailResponse
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } catch (emailError: any) {
        console.error('Detailed email error:', emailError)
        console.error('Error name:', emailError.name)
        console.error('Error message:', emailError.message)
        console.error('Error stack:', emailError.stack)
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send test email', 
            details: emailError.message,
            name: emailError.name,
            suggestion: use_debug ? 
              'Try checking your Resend API key in Supabase settings' : 
              'Try enabling debug mode or verify your domain at https://resend.com/domains'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }
    }

    // Calculate order totals
    const itemsTotal = order.order_items.reduce((sum: number, item: any) => sum + Number(item.total), 0)
    const orderTotal = Number(order.total)

    // Create email content based on event type
    let emailSubject = ''
    let eventTitle = ''
    
    switch (event_type) {
      case 'new_order':
        emailSubject = `New Order #${order.order_number} - ${websiteName}`
        eventTitle = 'New Order Received!'
        break
      case 'payment_received':
        emailSubject = `Payment Received for Order #${order.order_number} - ${websiteName}`
        eventTitle = 'Payment Received!'
        break
      case 'order_cancelled':
        emailSubject = `Order Cancelled #${order.order_number} - ${websiteName}`
        eventTitle = 'Order Cancelled'
        break
      default:
        emailSubject = `Order Update #${order.order_number} - ${websiteName}`
        eventTitle = 'Order Update'
    }
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${eventTitle}</h2>
        
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
          <a href="https://app.lovable.dev/dashboard/orders" 
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

    // Send email using Resend
    const { error: emailError } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [ownerEmail],
      subject: emailSubject,
      html: emailHtml
    })

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError.message}`)
    }

    // Log the email notification
    console.log(`${event_type} email notification sent to ${ownerEmail} for order ${order.order_number}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${event_type} email notification sent successfully`,
        order_number: order.order_number,
        event_type
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
