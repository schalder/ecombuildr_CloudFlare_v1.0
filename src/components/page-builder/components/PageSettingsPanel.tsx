import React, { useEffect, useState, useCallback } from 'react';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ColorPicker } from '@/components/ui/color-picker';
import { CompactMediaSelector } from './CompactMediaSelector';
import { SEOKeywordsInput } from '@/components/seo/SEOKeywordsInput';
import { SEOAuthorSection } from '@/components/seo/SEOAuthorSection';
import { SEOSocialImageSection } from '@/components/seo/SEOSocialImageSection';
import { SEOAdvancedSection } from '@/components/seo/SEOAdvancedSection';
import { SEOLanguageSection } from '@/components/seo/SEOLanguageSection';
import { SEOAnalysisSection } from '@/components/seo/SEOAnalysisSection';
import { PageBuilderData } from '../types';
import { validateFunnelStepSlug } from '@/lib/slugUtils';
import { debounce } from '@/lib/utils';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

interface PageSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pageData: {
    title: string;
    slug: string;
    is_published: boolean;
    is_homepage: boolean;
    seo_title: string;
    seo_description: string;
    seo_keywords: string[];
    meta_author: string;
    canonical_url: string;
    custom_meta_tags: { name: string; content: string }[];
    social_image_url: string;
    language_code: string;
    meta_robots: string;
  };
  setPageData: React.Dispatch<React.SetStateAction<{
    title: string;
    slug: string;
    is_published: boolean;
    is_homepage: boolean;
    seo_title: string;
    seo_description: string;
    seo_keywords: string[];
    meta_author: string;
    canonical_url: string;
    custom_meta_tags: { name: string; content: string }[];
    social_image_url: string;
    language_code: string;
    meta_robots: string;
  }>>;
  builderData: PageBuilderData;
  setBuilderData: React.Dispatch<React.SetStateAction<PageBuilderData>>;
  context: string;
  funnelId?: string; // Add funnelId for domain-wide validation
}

export const PageSettingsPanel: React.FC<PageSettingsPanelProps> = ({
  isOpen,
  onClose,
  pageData,
  setPageData,
  builderData,
  setBuilderData,
  context,
  funnelId
}) => {
  // Slug validation state
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [suggestedSlug, setSuggestedSlug] = useState('');
  const [finalSlug, setFinalSlug] = useState('');

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Check slug availability with domain-wide validation (NON-BLOCKING)
  const checkSlugAvailability = async (slug: string) => {
    if (!slug.trim() || !funnelId || context !== 'funnel') {
      setSlugStatus('idle');
      setFinalSlug(slug);
      setSuggestedSlug('');
      return;
    }
    
    setSlugStatus('checking');
    
    try {
      // Use domain-wide slug validation for funnel context
      const validation = await validateFunnelStepSlug(slug, funnelId);
      
      if (validation.hasConflict) {
        // Auto-populate the suggested slug in the input field
        setPageData(prev => ({ ...prev, slug: validation.uniqueSlug }));
        setSuggestedSlug(validation.uniqueSlug);
        setFinalSlug(validation.uniqueSlug);
        setSlugStatus('taken');
      } else {
        setFinalSlug(validation.uniqueSlug);
        setSuggestedSlug('');
        setSlugStatus('available');
      }
    } catch (error) {
      console.error('Slug check error:', error);
      setSlugStatus('error');
    }
  };

  // Debounced slug validation
  const debouncedCheckSlug = useCallback(
    debounce((slug: string) => checkSlugAvailability(slug), 500),
    [funnelId, context]
  );
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex justify-end"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-md bg-background h-full overflow-y-auto shadow-xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between sticky top-0 bg-background z-10">
          <h2 className="text-lg font-semibold">Page Settings</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="page-title">Page Title</Label>
                <Input
                  id="page-title"
                  value={pageData.title}
                  onChange={(e) => setPageData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter page title"
                />
              </div>
              
              <div>
                <Label htmlFor="page-slug">URL Slug</Label>
                <div className="relative">
                  <Input
                    id="page-slug"
                    value={pageData.slug}
                    onChange={(e) => {
                      const slug = generateSlug(e.target.value);
                      setPageData(prev => ({ ...prev, slug }));
                      // Reset validation state and trigger new validation
                      setSlugStatus('idle');
                      setSuggestedSlug('');
                      setFinalSlug('');
                      if (slug.trim() && funnelId && context === 'funnel') {
                        debouncedCheckSlug(slug);
                      }
                    }}
                    placeholder="page-url-slug"
                    className={`${
                      slugStatus === 'available' ? 'border-green-500' : 
                      slugStatus === 'taken' ? 'border-blue-500' :
                      slugStatus === 'error' ? 'border-red-500' : ''
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {slugStatus === 'checking' && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {slugStatus === 'available' && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    {slugStatus === 'taken' && (
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </div>
                
                {/* Status Messages */}
                {slugStatus === 'checking' && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking availability...
                  </p>
                )}
                {slugStatus === 'available' && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Slug is available
                  </p>
                )}
                {slugStatus === 'taken' && suggestedSlug && (
                  <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Slug auto-corrected to "{suggestedSlug}" to avoid conflicts
                  </p>
                )}
                {slugStatus === 'error' && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    Error checking slug availability
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="published-switch">Published</Label>
                <Switch
                  id="published-switch"
                  checked={pageData.is_published}
                  onCheckedChange={(checked) => setPageData(prev => ({ ...prev, is_published: checked }))}
                />
              </div>
              
              {context === 'website' && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="homepage-switch">Set as Homepage</Label>
                  <Switch
                    id="homepage-switch"
                    checked={pageData.is_homepage}
                    onCheckedChange={(checked) => setPageData(prev => ({ ...prev, is_homepage: checked }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seo-title">SEO Title</Label>
                <Input
                  id="seo-title"
                  value={pageData.seo_title}
                  onChange={(e) => setPageData(prev => ({ ...prev, seo_title: e.target.value }))}
                  placeholder="SEO optimized title"
                />
              </div>
              
              <div>
                <Label htmlFor="seo-description">SEO Description</Label>
                <Input
                  id="seo-description"
                  value={pageData.seo_description}
                  onChange={(e) => setPageData(prev => ({ ...prev, seo_description: e.target.value }))}
                  placeholder="Brief page description for search engines"
                />
              </div>
              
              <SEOKeywordsInput
                keywords={pageData.seo_keywords}
                onChange={(keywords) => setPageData(prev => ({ ...prev, seo_keywords: keywords }))}
              />
              
              <SEOAuthorSection
                author={pageData.meta_author}
                onChange={(author) => setPageData(prev => ({ ...prev, meta_author: author }))}
              />
              
              <SEOSocialImageSection
                socialImageUrl={pageData.social_image_url}
                onChange={(url) => setPageData(prev => ({ ...prev, social_image_url: url }))}
              />
              
              <SEOLanguageSection
                languageCode={pageData.language_code}
                onChange={(code) => setPageData(prev => ({ ...prev, language_code: code }))}
              />
              
              <SEOAdvancedSection
                canonicalUrl={pageData.canonical_url}
                metaRobots={pageData.meta_robots}
                customMetaTags={pageData.custom_meta_tags}
                onCanonicalChange={(url) => setPageData(prev => ({ ...prev, canonical_url: url }))}
                onMetaRobotsChange={(robots) => setPageData(prev => ({ ...prev, meta_robots: robots }))}
                onCustomMetaTagsChange={(tags) => setPageData(prev => ({ ...prev, custom_meta_tags: tags }))}
              />
              
              <SEOAnalysisSection
                data={{
                  title: pageData.title,
                  seo_title: pageData.seo_title,
                  seo_description: pageData.seo_description,
                  seo_keywords: pageData.seo_keywords,
                  meta_author: pageData.meta_author,
                  social_image_url: pageData.social_image_url,
                  canonical_url: pageData.canonical_url
                }}
              />
            </CardContent>
          </Card>

          {/* Page Background */}
          <Card>
            <CardHeader>
              <CardTitle>Page Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Background Type</Label>
                <RadioGroup
                  value={builderData.pageStyles?.backgroundType || 'none'}
                  onValueChange={(value) => {
                    setBuilderData(prev => ({
                      ...prev,
                      pageStyles: {
                        ...prev.pageStyles,
                        backgroundType: value as 'none' | 'color' | 'image'
                      }
                    }));
                  }}
                  className="flex flex-col gap-2 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="bg-none" />
                    <Label htmlFor="bg-none">None</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="color" id="bg-color" />
                    <Label htmlFor="bg-color">Solid Color</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="bg-image" />
                    <Label htmlFor="bg-image">Image</Label>
                  </div>
                </RadioGroup>
              </div>

              {builderData.pageStyles?.backgroundType === 'color' && (
                <div>
                  <Label>Background Color</Label>
                  <ColorPicker
                    color={builderData.pageStyles.backgroundColor || '#ffffff'}
                    onChange={(color) => {
                      setBuilderData(prev => ({
                        ...prev,
                        pageStyles: {
                          ...prev.pageStyles,
                          backgroundColor: color
                        }
                      }));
                    }}
                  />
                </div>
              )}

              {builderData.pageStyles?.backgroundType === 'image' && (
                <div>
                  <Label>Background Image</Label>
                  <CompactMediaSelector
                    value={builderData.pageStyles.backgroundImage || ''}
                    onChange={(url) => {
                      setBuilderData(prev => ({
                        ...prev,
                        pageStyles: {
                          ...prev.pageStyles,
                          backgroundImage: url
                        }
                      }));
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Page Spacing */}
          <Card>
            <CardHeader>
              <CardTitle>Page Spacing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="padding-top">Padding Top</Label>
                <Input
                  id="padding-top"
                  value={builderData.pageStyles?.paddingTop || '0px'}
                  onChange={(e) => {
                    setBuilderData(prev => ({
                      ...prev,
                      pageStyles: {
                        ...prev.pageStyles,
                        paddingTop: e.target.value
                      }
                    }));
                  }}
                  placeholder="0px"
                />
              </div>
              
              <div>
                <Label htmlFor="padding-bottom">Padding Bottom</Label>
                <Input
                  id="padding-bottom"
                  value={builderData.pageStyles?.paddingBottom || '40px'}
                  onChange={(e) => {
                    setBuilderData(prev => ({
                      ...prev,
                      pageStyles: {
                        ...prev.pageStyles,
                        paddingBottom: e.target.value
                      }
                    }));
                  }}
                  placeholder="40px"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};