// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetEBPayOrderDataRequest {
  transactionId: string;
  storeId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactionId, storeId }: GetEBPayOrderDataRequest = await req.json();
    console.log('Get EB Pay Order Data Request:', { transactionId, storeId });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get store settings for EB Pay configuration
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.ebpay) {
      console.error('Store error:', storeError);
      throw new Error('EB Pay configuration not found for this store');
    }

    const ebpayConfig = {
      merchant_id: store.settings.ebpay.merchant_id,
      api_key: store.settings.ebpay.api_key,
      base_url: store.settings.ebpay.is_live ? 'https://api.ebpay.com.bd' : 'https://sandbox-api.ebpay.com.bd',
    };

    // Get transaction details using EB Pay API
    const transactionResponse = await fetch(
      `${ebpayConfig.base_url}/v1/transactions/${transactionId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${ebpayConfig.api_key}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const transactionResult = await transactionResponse.json();
    console.log('EB Pay Transaction Details:', { 
      status: transactionResult.status, 
      transactionId,
      hasMetaData: !!transactionResult.meta_data 
    });

    if (transactionResult.status !== 'success') {
      throw new Error('Transaction not found or not successful');
    }

    // Parse the order data from meta_data
    let orderData = null;
    let itemsData = null;

    if (transactionResult.meta_data) {
      try {
        const parsedData = JSON.parse(transactionResult.meta_data);
        orderData = parsedData.orderData;
        itemsData = parsedData.itemsData;
      } catch (error) {
        console.error('Error parsing meta_data:', error);
        throw new Error('Failed to parse order data from transaction');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderData,
        itemsData,
        transactionDetails: {
          status: transactionResult.status,
          transactionId: transactionResult.transaction_id,
          amount: transactionResult.amount,
          customerName: transactionResult.customer_name,
          customerEmail: transactionResult.customer_email,
          customerPhone: transactionResult.customer_phone,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get EB Pay Order Data error:', error);
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
