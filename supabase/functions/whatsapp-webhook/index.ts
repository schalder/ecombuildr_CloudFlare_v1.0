import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.190.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Handle webhook verification (GET request)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('🔐 WhatsApp webhook verification request:', { mode, token, challenge });

      // For now, accept any verification token. In production, you should validate against stored tokens
      if (mode === 'subscribe' && token && challenge) {
        console.log('✅ Webhook verified successfully');
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      console.log('❌ Webhook verification failed');
      return new Response('Forbidden', { status: 403 });
    }

    // Handle webhook events (POST request)
    if (req.method === 'POST') {
      const body = await req.text();
      console.log('📨 Received WhatsApp webhook:', body);

      try {
        const webhookData = JSON.parse(body);

        // Process WhatsApp webhook events
        if (webhookData.object === 'whatsapp_business_account') {
          for (const entry of webhookData.entry || []) {
            for (const change of entry.changes || []) {
              if (change.field === 'messages') {
                await processMessageUpdate(supabase, change.value);
              }
            }
          }
        }

        return new Response('OK', { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });

      } catch (parseError) {
        console.error('❌ Error parsing webhook data:', parseError);
        return new Response('Bad Request', { status: 400 });
      }
    }

    return new Response('Method Not Allowed', { status: 405 });

  } catch (error) {
    console.error('❌ Error in whatsapp-webhook function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function processMessageUpdate(supabase: any, value: any) {
  try {
    console.log('📱 Processing message update:', JSON.stringify(value, null, 2));

    // Handle message status updates
    if (value.statuses && Array.isArray(value.statuses)) {
      for (const status of value.statuses) {
        const { id: messageId, status: messageStatus, timestamp } = status;
        
        console.log(`📊 Status update for message ${messageId}: ${messageStatus}`);

        // Update message status in queue
        const { error: updateError } = await supabase
          .from('whatsapp_message_queue')
          .update({
            status: mapWhatsAppStatus(messageStatus),
            updated_at: new Date().toISOString(),
          })
          .eq('whatsapp_message_id', messageId);

        if (updateError) {
          console.error(`❌ Error updating message status for ${messageId}:`, updateError);
        } else {
          console.log(`✅ Updated message ${messageId} status to ${messageStatus}`);
        }

        // If message was delivered or read, update notification
        if (['delivered', 'read'].includes(messageStatus)) {
          const { data: messageData } = await supabase
            .from('whatsapp_message_queue')
            .select('notification_id')
            .eq('whatsapp_message_id', messageId)
            .single();

          if (messageData) {
            await supabase
              .from('notifications')
              .update({
                delivery_status: 'delivered',
                delivered_at: new Date(parseInt(timestamp) * 1000).toISOString(),
              })
              .eq('id', messageData.notification_id);

            console.log(`✅ Updated notification ${messageData.notification_id} delivery status`);
          }
        }
      }
    }

    // Handle incoming messages (if needed for future features)
    if (value.messages && Array.isArray(value.messages)) {
      for (const message of value.messages) {
        console.log('📨 Received incoming message:', message);
        // Could implement auto-replies or customer service features here
      }
    }

  } catch (error) {
    console.error('❌ Error processing message update:', error);
  }
}

function mapWhatsAppStatus(whatsappStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'sent': 'sent',
    'delivered': 'delivered', 
    'read': 'read',
    'failed': 'failed',
  };

  return statusMap[whatsappStatus] || whatsappStatus;
}