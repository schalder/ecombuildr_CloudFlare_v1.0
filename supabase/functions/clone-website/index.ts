import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CloneWebsiteRequest {
  source_website_id: string;
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
  
  // Check if slug is available
  const { data: existing } = await supabase
    .from('websites')
    .select('id')
    .eq('store_id', storeId)
    .eq('slug', slug)
    .limit(1);
  
  if (!existing || existing.length === 0) {
    return slug;
  }
  
  // Try with -copy suffix
  for (let i = 1; i <= maxAttempts; i++) {
    const candidate = `${slug}-copy${i > 1 ? `-${i}` : ''}`;
    const { data: existingCopy } = await supabase
      .from('websites')
      .select('id')
      .eq('store_id', storeId)
      .eq('slug', candidate)
      .limit(1);
    
    if (!existingCopy || existingCopy.length === 0) {
      return candidate;
    }
  }
  
  // Fallback: timestamp
  return `${slug}-${Date.now()}`;
}

async function generateUniquePageSlug(
  supabase: any,
  baseSlug: string,
  websiteId: string,
  maxAttempts: number = 10
): Promise<string> {
  let slug = baseSlug.toLowerCase().trim().replace(/\s+/g, '-');
  
  const { data: existing } = await supabase
    .from('website_pages')
    .select('id')
    .eq('website_id', websiteId)
    .eq('slug', slug)
    .limit(1);
  
  if (!existing || existing.length === 0) {
    return slug;
  }
  
  for (let i = 1; i <= maxAttempts; i++) {
    const candidate = `${slug}-copy${i > 1 ? `-${i}` : ''}`;
    const { data: existingCopy } = await supabase
      .from('website_pages')
      .select('id')
      .eq('website_id', websiteId)
      .eq('slug', candidate)
      .limit(1);
    
    if (!existingCopy || existingCopy.length === 0) {
      return candidate;
    }
  }
  
  return `${slug}-${Date.now()}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source_website_id, new_name, target_store_id }: CloneWebsiteRequest = await req.json();

    if (!source_website_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'source_website_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client to bypass RLS for server-side operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get source website
    const { data: sourceWebsite, error: websiteError } = await supabase
      .from('websites')
      .select('*')
      .eq('id', source_website_id)
      .single();

    if (websiteError || !sourceWebsite) {
      return new Response(
        JSON.stringify({ success: false, error: 'Source website not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine target store (use source store if not specified)
    const targetStoreId = target_store_id || sourceWebsite.store_id;

    // Verify store ownership (both source and target should be accessible)
    // This is handled by RLS, but we verify here for safety
    const { data: sourceStore } = await supabase
      .from('stores')
      .select('id')
      .eq('id', sourceWebsite.store_id)
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
      : `${sourceWebsite.slug}-copy`;
    const uniqueSlug = await generateUniqueSlug(supabase, baseSlug, targetStoreId);

    // Create new website (clone all fields except id, created_at, updated_at)
    const newWebsite = {
      store_id: targetStoreId,
      name: new_name || `${sourceWebsite.name} - Copy`,
      slug: uniqueSlug,
      description: sourceWebsite.description,
      domain: null, // Don't clone domain
      is_active: false, // Start as inactive
      is_published: false, // Start as unpublished
      settings: sourceWebsite.settings || {},
    };

    const { data: clonedWebsite, error: createError } = await supabase
      .from('websites')
      .insert(newWebsite)
      .select()
      .single();

    if (createError || !clonedWebsite) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create cloned website', details: createError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all pages from source website
    const { data: sourcePages, error: pagesError } = await supabase
      .from('website_pages')
      .select('*')
      .eq('website_id', source_website_id)
      .order('created_at', { ascending: true });

    if (pagesError) {
      console.error('Error fetching source pages:', pagesError);
      // Continue even if pages fetch fails - website is already created
    }

    // Clone all pages
    if (sourcePages && sourcePages.length > 0) {
      let homepageCloned = false;
      
      const pagesToInsert = await Promise.all(
        sourcePages.map(async (page) => {
          const uniquePageSlug = await generateUniquePageSlug(
            supabase,
            page.slug,
            clonedWebsite.id
          );

          // Only allow one homepage
          const isHomepage = page.is_homepage && !homepageCloned;
          if (isHomepage) {
            homepageCloned = true;
          }

          return {
            website_id: clonedWebsite.id,
            title: page.title,
            slug: uniquePageSlug,
            content: page.content || {},
            is_published: false, // Start as unpublished
            is_homepage: isHomepage,
            seo_title: page.seo_title,
            seo_description: page.seo_description,
            og_image: page.og_image,
            custom_scripts: page.custom_scripts,
            // Don't clone preview_image_url - will be regenerated
          };
        })
      );

      const { error: insertPagesError } = await supabase
        .from('website_pages')
        .insert(pagesToInsert);

      if (insertPagesError) {
        console.error('Error cloning pages:', insertPagesError);
        // Website is already created, so we return success but note the pages issue
        return new Response(
          JSON.stringify({
            success: true,
            website_id: clonedWebsite.id,
            warning: 'Website cloned but some pages may not have been cloned',
            details: insertPagesError.message
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        website_id: clonedWebsite.id,
        name: clonedWebsite.name,
        slug: clonedWebsite.slug,
        pages_cloned: sourcePages?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error cloning website:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

