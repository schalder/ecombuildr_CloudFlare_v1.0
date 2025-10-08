import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )

    const { 
      store_id, 
      funnel_id, 
      form_name, 
      form_id, 
      custom_fields, 
      customer_name,
      customer_email,
      customer_phone,
      message,
      form_type,
      submit_action, 
      redirect_url, 
      redirect_step_id 
    } = await req.json()

    // Validate required fields
    if (!store_id || !form_name || !form_id || !custom_fields) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare submission data
    const submissionData = {
      store_id,
      funnel_id: funnel_id || null,
      form_name,
      form_id,
      custom_fields,
      customer_name: customer_name || '',
      customer_email: customer_email || '',
      customer_phone: customer_phone || null,
      message: message || null,
      form_type: form_type || 'custom_form',
      status: 'new'
    }

    // Insert form submission
    const { data, error } = await supabaseClient
      .from('form_submissions')
      .insert(submissionData)
      .select()
      .single()

    if (error) {
      console.error('Error inserting form submission:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to save form submission' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        submission_id: data.id,
        message: 'Form submitted successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in submit-custom-form function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
