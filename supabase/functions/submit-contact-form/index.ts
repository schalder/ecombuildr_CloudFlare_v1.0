import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactFormSubmission {
  store_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  message: string;
  product_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const formData: ContactFormSubmission = await req.json();

    // Insert form submission
    const { data: submission, error: insertError } = await supabase
      .from('form_submissions')
      .insert({
        store_id: formData.store_id,
        form_type: 'contact',
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        message: formData.message,
        product_id: formData.product_id,
        status: 'new'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting form submission:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit form' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Contact form submitted successfully:', submission.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Form submitted successfully',
        submission_id: submission.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-contact-form function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});