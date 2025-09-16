import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemberLoginRequest {
  email: string;
  password: string;
  store_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, store_id }: MemberLoginRequest = await req.json();

    if (!email || !password || !store_id) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and store ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get member account
    const { data: memberAccount, error: fetchError } = await supabase
      .from('member_accounts')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('store_id', store_id)
      .eq('is_active', true)
      .single();

    if (fetchError || !memberAccount) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Simple password verification (in production, use proper hashing)
    // For now, we'll use a simple comparison - this should be improved with proper bcrypt
    if (password !== memberAccount.password_hash) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Return member data (without password hash)
    const { password_hash, ...memberData } = memberAccount;
    
    return new Response(
      JSON.stringify({ member: memberData }),
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