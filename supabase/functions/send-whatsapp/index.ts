import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "text";
  text: {
    body: string;
  };
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
    );

    console.log('🚀 Starting WhatsApp message processor...');

    // Get pending messages from queue
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('whatsapp_message_queue')
      .select(`
        id,
        store_id,
        recipient_phone,
        message_text,
        retry_count,
        max_retries,
        whatsapp_business_accounts!inner(
          phone_number_id,
          access_token,
          is_verified,
          is_active
        )
      `)
      .eq('status', 'pending')
      .eq('whatsapp_business_accounts.is_verified', true)
      .eq('whatsapp_business_accounts.is_active', true)
      .lte('send_at', new Date().toISOString())
      .limit(10);

    if (fetchError) {
      console.error('❌ Error fetching pending messages:', fetchError);
      throw fetchError;
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      console.log('✅ No pending messages to process');
      return new Response(
        JSON.stringify({ message: 'No pending messages', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📨 Processing ${pendingMessages.length} pending messages`);

    let processed = 0;
    let failed = 0;

    for (const message of pendingMessages) {
      try {
        const whatsappAccount = message.whatsapp_business_accounts;
        
        if (!whatsappAccount.access_token || !whatsappAccount.phone_number_id) {
          console.error(`❌ Missing WhatsApp credentials for message ${message.id}`);
          await updateMessageStatus(supabase, message.id, 'failed', 'Missing WhatsApp credentials');
          failed++;
          continue;
        }

        // Prepare WhatsApp API request
        const whatsappMessage: WhatsAppMessage = {
          messaging_product: "whatsapp",
          to: message.recipient_phone.replace(/\D/g, ''), // Remove non-digits
          type: "text",
          text: {
            body: message.message_text
          }
        };

        console.log(`📱 Sending WhatsApp message to ${whatsappMessage.to}`);

        // Send message via WhatsApp Business API
        const whatsappResponse = await fetch(
          `https://graph.facebook.com/v18.0/${whatsappAccount.phone_number_id}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whatsappAccount.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(whatsappMessage),
          }
        );

        const responseData = await whatsappResponse.json();

        if (!whatsappResponse.ok) {
          console.error(`❌ WhatsApp API error for message ${message.id}:`, responseData);
          
          // Check if we should retry
          if (message.retry_count < message.max_retries) {
            await updateMessageForRetry(supabase, message.id, JSON.stringify(responseData.error));
          } else {
            await updateMessageStatus(supabase, message.id, 'failed', JSON.stringify(responseData.error));
            failed++;
          }
          continue;
        }

        console.log(`✅ WhatsApp message sent successfully:`, responseData);

        // Update message status to sent
        await updateMessageStatus(
          supabase, 
          message.id, 
          'sent', 
          null, 
          responseData.messages?.[0]?.id
        );

        // Update notification delivery status
        await supabase
          .from('notifications')
          .update({
            delivery_status: 'sent',
            delivered_at: new Date().toISOString()
          })
          .eq('id', message.notification_id);

        processed++;
        
      } catch (error) {
        console.error(`❌ Error processing message ${message.id}:`, error);
        
        // Check if we should retry
        if (message.retry_count < message.max_retries) {
          await updateMessageForRetry(supabase, message.id, error.message);
        } else {
          await updateMessageStatus(supabase, message.id, 'failed', error.message);
          failed++;
        }
      }
    }

    console.log(`🎉 Processing complete: ${processed} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: 'Messages processed', 
        processed, 
        failed,
        total: pendingMessages.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in send-whatsapp function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function updateMessageStatus(
  supabase: any, 
  messageId: string, 
  status: string, 
  errorMessage?: string | null,
  whatsappMessageId?: string | null
) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'sent') {
    updateData.sent_at = new Date().toISOString();
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  if (whatsappMessageId) {
    updateData.whatsapp_message_id = whatsappMessageId;
  }

  const { error } = await supabase
    .from('whatsapp_message_queue')
    .update(updateData)
    .eq('id', messageId);

  if (error) {
    console.error(`❌ Error updating message ${messageId} status:`, error);
  }
}

async function updateMessageForRetry(
  supabase: any, 
  messageId: string, 
  errorMessage: string
) {
  // Calculate next retry time (exponential backoff)
  const retryDelayMinutes = Math.pow(2, 1) * 5; // 5, 10, 20 minutes
  const nextRetryTime = new Date();
  nextRetryTime.setMinutes(nextRetryTime.getMinutes() + retryDelayMinutes);

  const { error } = await supabase
    .from('whatsapp_message_queue')
    .update({
      retry_count: supabase.rpc('increment', { column: 'retry_count' }),
      error_message: errorMessage,
      send_at: nextRetryTime.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId);

  if (error) {
    console.error(`❌ Error updating message ${messageId} for retry:`, error);
  }
}