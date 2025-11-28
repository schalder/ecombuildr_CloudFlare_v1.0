import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CloneFunnelRequest {
  source_funnel_id: string;
  new_name?: string;
  target_store_id?: string;
}

async function generateUniqueSlug(
  supabase: any,
  baseSlug: string,
  storeId: string,
  maxAttempts: number = 10
): Promise<string> {
  let slug = baseSlug.toLowerCase().trim().replace(/\s+/g, '-');
  
  const { data: existing } = await supabase
    .from('funnels')
    .select('id')
    .eq('store_id', storeId)
    .eq('slug', slug)
    .limit(1);
  
  if (!existing || existing.length === 0) {
    return slug;
  }
  
  for (let i = 1; i <= maxAttempts; i++) {
    const candidate = `${slug}-copy${i > 1 ? `-${i}` : ''}`;
    const { data: existingCopy } = await supabase
      .from('funnels')
      .select('id')
      .eq('store_id', storeId)
      .eq('slug', candidate)
      .limit(1);
    
    if (!existingCopy || existingCopy.length === 0) {
      return candidate;
    }
  }
  
  return `${slug}-${Date.now()}`;
}

async function generateUniqueStepSlug(
  supabase: any,
  baseSlug: string,
  funnelId: string,
  maxAttempts: number = 10
): Promise<string> {
  let slug = baseSlug.toLowerCase().trim().replace(/\s+/g, '-');
  
  const { data: existing } = await supabase
    .from('funnel_steps')
    .select('id')
    .eq('funnel_id', funnelId)
    .eq('slug', slug)
    .limit(1);
  
  if (!existing || existing.length === 0) {
    return slug;
  }
  
  for (let i = 1; i <= maxAttempts; i++) {
    const candidate = `${slug}-copy${i > 1 ? `-${i}` : ''}`;
    const { data: existingCopy } = await supabase
      .from('funnel_steps')
      .select('id')
      .eq('funnel_id', funnelId)
      .eq('slug', candidate)
      .limit(1);
    
    if (!existingCopy || existingCopy.length === 0) {
      return candidate;
    }
  }
  
  return `${slug}-${Date.now()}`;
}

async function getNextStepOrder(supabase: any, funnelId: string): Promise<number> {
  const { data: steps } = await supabase
    .from('funnel_steps')
    .select('step_order')
    .eq('funnel_id', funnelId)
    .order('step_order', { ascending: false })
    .limit(1);
  
  if (!steps || steps.length === 0) {
    return 1;
  }
  
  return (steps[0].step_order || 0) + 1;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source_funnel_id, new_name, target_store_id }: CloneFunnelRequest = await req.json();

    if (!source_funnel_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'source_funnel_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get source funnel
    const { data: sourceFunnel, error: funnelError } = await supabase
      .from('funnels')
      .select('*')
      .eq('id', source_funnel_id)
      .single();

    if (funnelError || !sourceFunnel) {
      return new Response(
        JSON.stringify({ success: false, error: 'Source funnel not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine target store
    const targetStoreId = target_store_id || sourceFunnel.store_id;

    // Verify stores exist
    const { data: sourceStore } = await supabase
      .from('stores')
      .select('id')
      .eq('id', sourceFunnel.store_id)
      .single();

    const { data: targetStore } = await supabase
      .from('stores')
      .select('id')
      .eq('id', targetStoreId)
      .single();

    if (!sourceStore || !targetStore) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique slug
    const baseSlug = new_name 
      ? new_name.toLowerCase().trim().replace(/\s+/g, '-')
      : `${sourceFunnel.slug}-copy`;
    const uniqueSlug = await generateUniqueSlug(supabase, baseSlug, targetStoreId);

    // Create new funnel
    const newFunnel = {
      store_id: targetStoreId,
      name: new_name || `${sourceFunnel.name} - Copy`,
      slug: uniqueSlug,
      description: sourceFunnel.description,
      domain: null, // Don't clone domain
      is_active: false,
      is_published: false,
      settings: sourceFunnel.settings || {},
      website_id: sourceFunnel.website_id, // Keep website_id if it exists
    };

    const { data: clonedFunnel, error: createError } = await supabase
      .from('funnels')
      .insert(newFunnel)
      .select()
      .single();

    if (createError || !clonedFunnel) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create cloned funnel', details: createError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all steps from source funnel (ordered by step_order)
    const { data: sourceSteps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('*')
      .eq('funnel_id', source_funnel_id)
      .order('step_order', { ascending: true });

    if (stepsError) {
      console.error('Error fetching source steps:', stepsError);
    }

    // Clone all steps
    if (sourceSteps && sourceSteps.length > 0) {
      let currentStepOrder = 1;
      
      const stepsToInsert = await Promise.all(
        sourceSteps.map(async (step) => {
          const uniqueStepSlug = await generateUniqueStepSlug(
            supabase,
            step.slug,
            clonedFunnel.id
          );

          const stepOrder = currentStepOrder++;
          
          return {
            funnel_id: clonedFunnel.id,
            title: step.title,
            slug: uniqueStepSlug,
            step_order: stepOrder,
            step_type: step.step_type,
            content: step.content || {},
            is_published: false,
            seo_title: step.seo_title,
            seo_description: step.seo_description,
            og_image: step.og_image,
            custom_scripts: step.custom_scripts,
          };
        })
      );

      const { error: insertStepsError } = await supabase
        .from('funnel_steps')
        .insert(stepsToInsert);

      if (insertStepsError) {
        console.error('Error cloning steps:', insertStepsError);
        return new Response(
          JSON.stringify({
            success: true,
            funnel_id: clonedFunnel.id,
            warning: 'Funnel cloned but some steps may not have been cloned',
            details: insertStepsError.message
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        funnel_id: clonedFunnel.id,
        name: clonedFunnel.name,
        slug: clonedFunnel.slug,
        steps_cloned: sourceSteps?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error cloning funnel:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

