// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.208.0/crypto/crypto.ts";
import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetEPSOrderDataRequest {
  merchantTransactionId: string;
  storeId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { merchantTransactionId, storeId }: GetEPSOrderDataRequest = await req.json();
    console.log('Get EPS Order Data Request:', { merchantTransactionId, storeId });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get store settings for EPS configuration
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.eps) {
      console.error('Store error:', storeError);
      throw new Error('EPS configuration not found for this store');
    }

    const epsConfig = {
      merchant_id: store.settings.eps.merchant_id,
      store_id: store.settings.eps.store_id,
      username: store.settings.eps.username,
      password: store.settings.eps.password,
      hash_key: store.settings.eps.hash_key,
      base_url: store.settings.eps.is_live ? 'https://pgapi.eps.com.bd' : 'https://sandboxpgapi.eps.com.bd',
    };

    // Helper function to generate HMAC-SHA512 hash
    async function generateHash(data: string, key: string): Promise<string> {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(key);
      const dataToSign = encoder.encode(data);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);
      return encodeBase64(new Uint8Array(signature));
    }

    // Get authentication token
    const userNameHash = await generateHash(epsConfig.username, epsConfig.hash_key);

    const tokenResponse = await fetch(`${epsConfig.base_url}/v1/Auth/GetToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-hash': userNameHash,
      },
      body: JSON.stringify({
        userName: epsConfig.username,
        password: epsConfig.password,
      }),
    });

    const tokenResult = await tokenResponse.json();
    
    if (!tokenResult.token) {
      console.error('Failed to get EPS token:', tokenResult.errorMessage);
      throw new Error('Failed to authenticate with EPS');
    }

    // Get transaction details using the merchant transaction ID
    const merchantTransactionHash = await generateHash(merchantTransactionId, epsConfig.hash_key);

    const transactionResponse = await fetch(
      `${epsConfig.base_url}/v1/EPSEngine/CheckMerchantTransactionStatus?merchantTransactionId=${merchantTransactionId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${tokenResult.token}`,
          'x-hash': merchantTransactionHash,
        },
      }
    );

    const transactionResult = await transactionResponse.json();
    console.log('EPS Transaction Details:', { 
      status: transactionResult.Status, 
      merchantTransactionId,
      hasValueA: !!transactionResult.ValueA 
    });

    if (transactionResult.Status !== 'Success') {
      throw new Error('Transaction not found or not successful');
    }

    // Parse the order data from ValueA
    let orderData = null;
    let itemsData = null;

    if (transactionResult.ValueA) {
      try {
        const parsedData = JSON.parse(transactionResult.ValueA);
        orderData = parsedData.orderData;
        itemsData = parsedData.itemsData;
      } catch (error) {
        console.error('Error parsing ValueA:', error);
        throw new Error('Failed to parse order data from transaction');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderData,
        itemsData,
        transactionDetails: {
          status: transactionResult.Status,
          merchantTransactionId: transactionResult.MerchantTransactionId,
          epsTransactionId: transactionResult.EPSTransactionId,
          amount: transactionResult.Amount,
          customerName: transactionResult.CustomerName,
          customerEmail: transactionResult.CustomerEmail,
          customerPhone: transactionResult.CustomerPhone,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get EPS Order Data error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to retrieve order data' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
