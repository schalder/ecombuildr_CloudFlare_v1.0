// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.208.0/crypto/crypto.ts";
import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  method: 'eps';
  password?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, paymentId, method, password }: VerifyPaymentRequest = await req.json();
    console.log('EPS Course Verification Request:', { orderId, paymentId, method, hasPassword: !!password });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let paymentStatus = 'failed';

    // Get course order details to find store ID
    const { data: order, error: orderError } = await supabase
      .from('course_orders')
      .select('store_id, metadata')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Course order not found');
    }

    if (method === 'eps') {
      // Get merchant transaction ID from order metadata or use paymentId
      const storedMTID = order.metadata?.eps?.merchantTransactionId;
      const merchantTxnId = paymentId && paymentId !== orderId ? paymentId : storedMTID;
      
      if (!merchantTxnId) {
        console.error('EPS verify: missing merchantTransactionId');
        paymentStatus = 'failed';
      } else {
        paymentStatus = await verifyEPSPayment(merchantTxnId, order.store_id, supabase);
      }
    }

    // Update course order status
    const orderStatus = paymentStatus === 'success' ? 'completed' : 'payment_failed';
    
    console.log('EPS verify: updating course order status', { orderId, orderStatus, paymentStatus });
    
    const { error } = await supabase
      .from('course_orders')
      .update({
        payment_status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('EPS verify: failed to update course order', { error: error.message, orderId });
      throw new Error(`Failed to update course order: ${error.message}`);
    }
    
    console.log('EPS verify: course order updated successfully', { orderId, orderStatus });

    // Create member account and grant course access for successful payments
    if (paymentStatus === 'success') {
      try {
        const { data: orderDetails, error: orderFetchError } = await supabase
          .from('course_orders')
          .select('store_id, course_id, customer_name, customer_email, customer_phone, is_new_student')
          .eq('id', orderId)
          .single();

        if (orderFetchError) {
          console.error('Error fetching order details:', orderFetchError);
        } else if (orderDetails) {
          if (orderDetails.is_new_student) {
            // Handle new student - create account
            // Use provided password or generate secure one if missing
            let memberPassword = password;
            let isGeneratedPassword = false;
            
            if (!memberPassword) {
              // Generate random secure password: 8 chars with mix of letters/numbers
              const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
              memberPassword = Array.from({ length: 8 }, () => 
                chars.charAt(Math.floor(Math.random() * chars.length))
              ).join('');
              isGeneratedPassword = true;
              console.log('Generated password for member account (length:', memberPassword.length, ')');
            }

            // Create member account with plaintext password (DB function handles hashing)
            const { data: memberId, error: memberError } = await supabase.rpc('create_member_account_with_password', {
              p_store_id: orderDetails.store_id,
              p_email: orderDetails.customer_email,
              p_password: memberPassword,
              p_full_name: orderDetails.customer_name,
              p_phone: orderDetails.customer_phone,
              p_course_order_id: orderId
            });

            if (memberError) {
              console.error('Member account creation error for EPS:', memberError);
            } else {
              console.log('EPS verify: member account created successfully', { memberId, email: orderDetails.customer_email });
              
              // Update order metadata with member password only if it was generated (not from checkout)
              if (isGeneratedPassword) {
                const currentMetadata = order.metadata || {};
                const { error: updateError } = await supabase
                  .from('course_orders')
                  .update({ 
                    metadata: { 
                      ...currentMetadata, 
                      member_password: memberPassword 
                    } 
                  })
                  .eq('id', orderId);
                  
                if (updateError) {
                  console.error('Error updating order with generated password:', updateError);
                }
              }
              
              // Grant course access
              const { error: accessError } = await supabase.rpc('grant_course_access', {
                p_member_account_id: memberId,
                p_course_id: orderDetails.course_id,
                p_course_order_id: orderId
              });

              if (accessError) {
                console.error('Course access grant error for EPS:', accessError);
              } else {
                console.log('EPS verify: course access granted successfully', { memberId, courseId: orderDetails.course_id });
              }
            }
          } else {
            // Handle returning student - verify credentials and grant access
            try {
              const { data: memberData, error: memberError } = await supabase.rpc('verify_member_credentials', {
                p_email: orderDetails.customer_email,
                p_password: password,
                p_store_id: orderDetails.store_id
              });

              if (memberError || !memberData || memberData.length === 0) {
                console.error('Invalid member credentials for returning student:', memberError);
                throw new Error('Invalid member credentials');
              }

              const memberAccount = memberData[0];
              
              // Grant course access for successful payment
              const { error: accessError } = await supabase.rpc('grant_course_access', {
                p_member_account_id: memberAccount.id,
                p_course_id: orderDetails.course_id,
                p_course_order_id: orderId
              });

              if (accessError) {
                console.error('Error granting course access to returning student:', accessError);
              } else {
                console.log('Course access granted to returning student for EPS payment');
              }
            } catch (error) {
              console.error('Returning student verification error for EPS:', error);
              throw new Error('Failed to verify returning student credentials');
            }
          }
        }
      } catch (error) {
        console.error('Member account creation error for EPS:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: paymentStatus === 'success',
        message: paymentStatus === 'success' ? 'Payment verified successfully' : 'Payment verification failed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('EPS course payment verification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Payment verification failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function verifyEPSPayment(transactionId: string, storeId: string, supabase: any): Promise<string> {
  try {
    // Get store settings for EPS configuration
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.eps) {
      console.error('EPS configuration not found for store:', storeId);
      return 'failed';
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
      return 'failed';
    }

    // Verify payment using the merchant transaction ID
    const merchantTransactionHash = await generateHash(transactionId, epsConfig.hash_key);

    const verifyResponse = await fetch(
      `${epsConfig.base_url}/v1/EPSEngine/CheckMerchantTransactionStatus?merchantTransactionId=${transactionId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${tokenResult.token}`,
          'x-hash': merchantTransactionHash,
        },
      }
    );

    const verifyResult = await verifyResponse.json();
    console.log('EPS Verification Result:', { status: verifyResult.Status, transactionId });
    
    return verifyResult.Status === 'Success' ? 'success' : 'failed';
  } catch (error) {
    console.error('EPS verification error:', error);
    return 'failed';
  }
}