import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    console.log('📝 Form submission received:', { ...body, customer_email: body.customer_email ? '[REDACTED]' : undefined })

    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      message, 
      formType = 'contact',
      storeId 
    } = body

    if (!customer_name || !customer_email || !message || !storeId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: customer_name, customer_email, message, and storeId are required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customer_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Verify store exists and is active
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, is_active')
      .eq('id', storeId)
      .single()

    if (storeError || !store || !store.is_active) {
      console.error('❌ Store validation failed:', storeError)
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive store' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Insert form submission
    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        store_id: storeId,
        form_type: formType,
        customer_name: customer_name.trim(),
        customer_email: customer_email.trim().toLowerCase(),
        customer_phone: customer_phone?.trim() || null,
        message: message.trim(),
        status: 'new'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to save form submission' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('✅ Form submission saved successfully:', data.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Form submitted successfully',
        submissionId: data.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error in form-submit:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})