import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemberLoginRequest {
  email: string;
  password: string;
  store_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, store_id }: MemberLoginRequest = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Use secure database function to verify credentials
    const { data: memberData, error: verifyError } = store_id 
      ? await supabase.rpc('verify_member_credentials', {
          p_email: email,
          p_password: password,
          p_store_id: store_id
        })
      : await supabase.rpc('verify_member_credentials_any_store', {
          p_email: email,
          p_password: password
        });

    if (verifyError) {
      console.error('Member credential verification error:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!memberData || memberData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const memberAccount = memberData[0];
    
    return new Response(
      JSON.stringify({ member: memberAccount }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Member login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);