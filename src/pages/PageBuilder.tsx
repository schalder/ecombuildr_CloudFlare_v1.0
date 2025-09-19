import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ColorPicker } from '@/components/ui/color-picker';
import { CompactMediaSelector } from '@/components/page-builder/components/CompactMediaSelector';
import { ElementorPageBuilder } from '@/components/page-builder/ElementorPageBuilder';
import { SEOKeywordsInput } from '@/components/seo/SEOKeywordsInput';
import { SEOAuthorSection } from '@/components/seo/SEOAuthorSection';
import { SEOSocialImageSection } from '@/components/seo/SEOSocialImageSection';
import { SEOAdvancedSection } from '@/components/seo/SEOAdvancedSection';
import { SEOLanguageSection } from '@/components/seo/SEOLanguageSection';
import { SEOAnalysisSection } from '@/components/seo/SEOAnalysisSection';
import { PageBuilderData } from '@/components/page-builder/types';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';
import { useQueryClient } from '@tanstack/react-query';
import { setGlobalCurrency } from '@/lib/currency';
import { useStore } from '@/contexts/StoreContext';
import { WebsiteProvider } from '@/contexts/WebsiteContext';

import { SEOConfig } from '@/lib/seo';
import { FunnelStepToolbar } from '@/components/page-builder/components/FunnelStepToolbar';
import { FunnelStepProvider } from '@/contexts/FunnelStepContext';
import { ResponsiveControls } from '@/components/page-builder/components/ResponsiveControls';
import { getDevicePreviewStyles } from '@/components/page-builder/utils/responsive';
import { PageSettingsPanel } from '@/components/page-builder/components/PageSettingsPanel';

export default function PageBuilder() {
  const navigate = useNavigate();
  const { pageId, websiteId, funnelId, stepId } = useParams();
  const location = useLocation();
  const { store: currentStore } = useUserStore();
  const { loadStoreById } = useStore();
  const queryClient = useQueryClient();
  
  // Determine context based on URL parameters
  const context = websiteId ? 'website' : funnelId ? 'funnel' : 'store';
  const entityId = pageId || stepId;
  const parentId = websiteId || funnelId;
  
  const [pageData, setPageData] = useState({
    title: 'New Page',
    slug: 'new-page',
    is_published: false,
    is_homepage: false,
    seo_title: '',
    seo_description: '',
    seo_keywords: [] as string[],
    meta_author: '',
    canonical_url: '',
    custom_meta_tags: [] as { name: string; content: string }[],
    social_image_url: '',
    language_code: 'en',
    meta_robots: 'index,follow'
  });
  
  const [builderData, setBuilderData] = useState<PageBuilderData>({ 
    sections: [],
    pageStyles: {
      backgroundType: 'none',
      paddingTop: '0px',
      paddingBottom: '40px',
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat'
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!pageId);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDeviceType, setPreviewDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  

  const loadPage = useCallback(async () => {
    if (!entityId || !currentStore) return;
    
    // Validate that entityId is not "undefined" string
    if (entityId === "undefined") {
      console.error('Invalid page ID: undefined');
      toast.error('Invalid page ID. Please select a valid page.');
      if (context === 'website') {
        navigate(`/dashboard/websites/${parentId}`);
      } else if (context === 'funnel') {
        navigate(`/dashboard/funnels/${parentId}`);
      } else {
        navigate('/dashboard/pages');
      }
      return;
    }
    
    try {
      setIsLoading(true);
      
      let query;
      if (context === 'website') {
        query = supabase
          .from('website_pages')
          .select('*')
          .eq('id', entityId)
          .eq('website_id', parentId);
      } else if (context === 'funnel') {
        query = supabase
          .from('funnel_steps')
          .select('*')
          .eq('id', entityId)
          .eq('funnel_id', parentId);
      } else {
        query = supabase
          .from('pages')
          .select('*')
          .eq('id', entityId)
          .eq('store_id', currentStore.id);
      }

      const { data, error } = await query.single();
      if (error) throw error;

      if (data) {
        setPageData({
          title: data.title,
          slug: data.slug,
          is_published: data.is_published,
          is_homepage: data.is_homepage || false,
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || '',
          seo_keywords: data.seo_keywords || [],
          meta_author: data.meta_author || '',
          canonical_url: data.canonical_url || '',
          custom_meta_tags: data.custom_meta_tags || [],
          social_image_url: data.social_image_url || '',
          language_code: data.language_code || 'en',
          meta_robots: data.meta_robots || 'index,follow'
        });

        // Convert page content to page builder format
        if (data.content) {
          try {
            const content = data.content as any;
            const pageStyles = content.pageStyles || {
              backgroundType: 'none',
              paddingTop: '0px',
              paddingBottom: '40px',
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat'
            };
            
            // Auto-fix legacy 40px paddingTop to 0px
            if (pageStyles.paddingTop === '40px') {
              pageStyles.paddingTop = '0px';
            }
            
            setBuilderData({ 
              sections: content.sections || [], 
              globalStyles: content.globalStyles,
              pageStyles
            });
          } catch (error) {
            console.error('Error parsing page content:', error);
            setBuilderData({ sections: [] });
          }
        }
      }
    } catch (error) {
      console.error('Error loading page:', error);
      toast.error('Failed to load page');
    } finally {
      setIsLoading(false);
    }
  }, [entityId, currentStore, context, parentId]);

  const handleSave = useCallback(async (overridePublished?: boolean) => {
    if (!currentStore) {
      toast.error('No store selected');
      return;
    }

    try {
      setIsSaving(true);

      // Use override if provided, otherwise use current state
      const publishedState = overridePublished !== undefined ? overridePublished : pageData.is_published;

      // Prepare page content for database
      const pageContent = {
        sections: builderData.sections,
        globalStyles: builderData.globalStyles || {},
        pageStyles: builderData.pageStyles || {}
      };

      const pagePayload = {
        title: pageData.title,
        slug: pageData.slug,
        content: JSON.parse(JSON.stringify(pageContent)),
        is_published: publishedState,
        seo_title: pageData.seo_title,
        seo_description: pageData.seo_description,
        seo_keywords: pageData.seo_keywords,
        meta_author: pageData.meta_author,
        canonical_url: pageData.canonical_url,
        custom_meta_tags: pageData.custom_meta_tags,
        social_image_url: pageData.social_image_url,
        language_code: pageData.language_code,
        meta_robots: pageData.meta_robots,
        ...(context === 'website' && { is_homepage: pageData.is_homepage })
      };

      let result;
      if (entityId) {
        // Update existing page/step
        if (context === 'website') {
          result = await supabase
            .from('website_pages')
            .update(pagePayload)
            .eq('id', entityId)
            .eq('website_id', parentId);
        } else if (context === 'funnel') {
          result = await supabase
            .from('funnel_steps')
            .update(pagePayload)
            .eq('id', entityId)
            .eq('funnel_id', parentId);
        } else {
          result = await supabase
            .from('pages')
            .update({ ...pagePayload, store_id: currentStore.id })
            .eq('id', entityId)
            .eq('store_id', currentStore.id);
        }
      } else {
        // Create new page (shouldn't happen in this fixed version)
        result = await supabase
          .from('pages')
          .insert({ ...pagePayload, store_id: currentStore.id });
      }

      if (result.error) throw result.error;

      // Update local state if we used override
      if (overridePublished !== undefined) {
        setPageData(prev => ({ ...prev, is_published: publishedState }));
      }

      // Generate preview image after successful save using DOM approach
      if (entityId && (context === 'website' || context === 'funnel')) {
        try {
          const { generateAndSavePagePreviewFromDOM } = await import('@/lib/pagePreviewRenderer');
          const previewType = context === 'website' ? 'website_page' : 'funnel_step';
          
          // Use the DOM approach like admin template builder
          setTimeout(() => {
            generateAndSavePagePreviewFromDOM('page-preview-hidden', entityId, previewType).catch(error => {
              console.warn('DOM preview generation failed:', error);
            });
          }, 500);
        } catch (previewError) {
          console.warn('Failed to load preview generation module:', previewError);
        }
      }

      toast.success(publishedState ? 'Page saved and published successfully!' : 'Page saved successfully!');


    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  }, [currentStore, builderData, pageData, entityId, context, parentId]);

  // Load existing page if editing
  useEffect(() => {
    if (entityId && currentStore) {
      loadPage();
    }
  }, [entityId, currentStore, context, loadPage]);

  // Preload store context and currency for builder preview
  const [resolvedWebsiteId, setResolvedWebsiteId] = useState<string | undefined>();

  useEffect(() => {
    if (parentId) {
      (async () => {
        try {
          if (context === 'website') {
            setResolvedWebsiteId(parentId);
            const { data } = await supabase
              .from('websites')
              .select('settings, store_id')
              .eq('id', parentId)
              .maybeSingle();
            
            if (data) {
              // Load store context for e-commerce elements
              if (data.store_id) await loadStoreById(data.store_id);
              
              // Set currency
              const code = (data as any)?.settings?.currency?.code || 'BDT';
              setGlobalCurrency(code as any);
            }
          } else if (context === 'funnel') {
            const { data } = await supabase
              .from('funnels')
              .select('store_id, website_id')
              .eq('id', parentId)
              .maybeSingle();
            
            if (data) {
              // Set resolved website ID for WebsiteContext
              setResolvedWebsiteId(data.website_id);
              
              if (data.store_id) {
                // Load store context for e-commerce elements
                await loadStoreById(data.store_id);
                
                // Set currency from store settings
                const { data: store } = await supabase
                  .from('stores')
                  .select('settings')
                  .eq('id', data.store_id)
                  .maybeSingle();
                const code = (store as any)?.settings?.currency || 'BDT';
                setGlobalCurrency(code as any);
              }
            }
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [context, parentId, loadStoreById]);

  // Tab visibility handling to prevent unnecessary operations
  const isPageVisible = useRef(true);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Save on Cmd/Ctrl+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!isSaving && isPageVisible.current) handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSaving, handleSave]);

  const handlePreview = () => {
    if (!currentStore) return;
    
    let previewUrl;
    if (context === 'website') {
      previewUrl = `/website/${parentId}/${pageData.slug}`;
    } else if (context === 'funnel') {
      previewUrl = `/funnel/${parentId}/${pageData.slug}`;
    } else {
      previewUrl = `/store/${currentStore.slug}/${pageData.slug}`;
    }
    window.open(previewUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading page builder...</p>
        </div>
      </div>
    );
  }

  const pageTitle = `Page Builder: ${pageData.title} | EcomBuildr`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <WebsiteProvider websiteId={resolvedWebsiteId}>
        <FunnelStepProvider stepId={stepId || null} funnelId={funnelId || null}>
          <div className="h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Invalidate relevant queries when navigating back
              if (context === 'website') {
                queryClient.invalidateQueries({ queryKey: ['website-pages', parentId] });
                navigate(`/dashboard/websites/${parentId}`);
              } else if (context === 'funnel') {
                queryClient.invalidateQueries({ queryKey: ['funnel-steps', parentId] });
                navigate(`/dashboard/funnels/${parentId}`);
              } else {
                navigate('/dashboard/pages');
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {context === 'website' ? 'Website' : context === 'funnel' ? 'Funnel' : 'Pages'}
          </Button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{pageData.title}</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              data-settings-trigger
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {context === 'funnel' && stepId && funnelId && (
            <FunnelStepToolbar stepId={stepId} funnelId={funnelId} />
          )}
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          <Button 
            onClick={async () => {
              if (!pageData.is_published) {
                // Save with published = true
                await handleSave(true);
              } else {
                await handleSave();
              }
            }} 
            disabled={isSaving}
            className={pageData.is_published ? "" : "bg-green-600 hover:bg-green-700"}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving 
              ? 'Saving...' 
              : pageData.is_published 
                ? 'Save' 
                : 'Save & Publish'
            }
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Page Builder */}
        <div className="flex-1 min-h-0">
          {showPreview ? (
            <div className="h-full flex flex-col">
              {/* Sticky Preview Header */}
              <div className="sticky top-0 z-10 bg-white border-b">
                <div className="bg-muted/50 px-4 py-2 text-sm text-muted-foreground flex items-center justify-between">
                  <span>Page Preview</span>
                  <ResponsiveControls
                    deviceType={previewDeviceType}
                    onDeviceChange={setPreviewDeviceType}
                    className="bg-transparent border-0 p-0"
                  />
                </div>
              </div>
              
              {/* Scrollable Preview Content */}
              <div className="flex-1 overflow-auto bg-muted/30 p-6">
                <div className="max-w-7xl mx-auto">
                  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="bg-muted/10 p-4 flex justify-center">
                      <div style={getDevicePreviewStyles(previewDeviceType)} className={previewDeviceType === 'mobile' ? 'pb-mobile' : previewDeviceType === 'tablet' ? 'pb-tablet' : ''}>
                        <PageBuilderRenderer data={builderData} deviceType={previewDeviceType} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ElementorPageBuilder
              initialData={builderData}
              onChange={setBuilderData}
              onSave={handleSave}
              isSaving={isSaving}
            />
          )}
        </div>

      </div>

      {/* Page Settings Panel */}
      <PageSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        pageData={pageData}
        setPageData={setPageData}
        builderData={builderData}
        setBuilderData={setBuilderData}
        context={context}
      />

        {/* Hidden Preview for Screenshot Generation - Same approach as AdminTemplateEditor */}
        <div 
          id="page-preview-hidden"
          className="fixed -top-[10000px] left-0 bg-white"
          style={{ 
            width: '1200px', 
            height: '675px',
            overflow: 'hidden'
          }}
        >
          <PageBuilderRenderer data={builderData} deviceType="desktop" />
        </div>
          </div>
        </FunnelStepProvider>
      </WebsiteProvider>
    </>
  );
}