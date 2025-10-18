import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, ExternalLink, Settings, Eye, Copy, CheckIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreatePageModal } from '@/components/modals/CreatePageModal';
import { WebsiteSettings } from '@/components/website/WebsiteSettings';
import { WebsiteShipping } from '@/components/website/WebsiteShipping';
import { WebsitePageSettingsModal } from '@/components/modals/WebsitePageSettingsModal';
import { WebsiteHeaderBuilder } from '@/components/website/WebsiteHeaderBuilder';
import { WebsiteFooterBuilder } from '@/components/website/WebsiteFooterBuilder';
import { WebsiteStats } from '@/components/website/WebsiteStats';
import { WebsiteSales } from '@/components/website/WebsiteSales';
import { WebsiteFOMO } from '@/components/website/WebsiteFOMO';

interface Website {
  id: string;
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  canonical_domain?: string;
  connected_domain?: string;
  is_active: boolean;
  is_published: boolean;
  settings: any;
  created_at: string;
  updated_at: string;
}

interface WebsitePage {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  is_homepage: boolean;
  created_at: string;
  updated_at: string;
  preview_image_url?: string;
}

const WebsiteManagement = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<WebsitePage | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  
  const activeTab = searchParams.get('tab') || 'pages';

  const { data: website, isLoading } = useQuery({
    queryKey: ['website', id],
    queryFn: async () => {
      // First get the website data
      const { data: websiteData, error: websiteError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', id)
        .single();
      
      if (websiteError) throw websiteError;

      // Then get domain connection if any
      const { data: connectionData, error: connectionError } = await supabase
        .from('domain_connections')
        .select(`
          content_id,
          custom_domains (domain)
        `)
        .eq('content_type', 'website')
        .eq('content_id', id)
        .maybeSingle();

      // Add connected domain info (ignore connection errors as domain might not be connected)
      const connectedDomain = (connectionData?.custom_domains as any)?.domain || null;
      
      return {
        ...websiteData,
        connected_domain: connectedDomain
      } as Website;
    },
    enabled: !!id,
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['website-pages', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_pages')
        .select('*')
        .eq('website_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WebsitePage[];
    },
    enabled: !!id,
  });

  const updateWebsiteMutation = useMutation({
    mutationFn: async (updates: Partial<Website>) => {
      const { data, error } = await supabase
        .from('websites')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['website', id] });
      toast({ title: 'Website updated successfully' });

    },
  });

  const regeneratePreviewMutation = useMutation({
    mutationFn: async () => {
      // Preview regeneration is handled by Vercel edge middleware, no action needed
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({ 
        title: 'Share preview updated', 
        description: 'Your social media sharing preview has been refreshed.' 
      });
    },
    onError: (error) => {
      console.error('Failed to regenerate preview:', error);
      toast({ 
        title: 'Failed to update preview', 
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  });

  const handleToggleActive = (isActive: boolean) => {
    updateWebsiteMutation.mutate({ is_active: isActive });
  };

  const handleTogglePublished = (isPublished: boolean) => {
    updateWebsiteMutation.mutate({ is_published: isPublished });
  };

  // Compute homepage URL
  const getHomepageUrl = () => {
    if (!website) return '';
    
    const domain = website.connected_domain || website.canonical_domain;
    if (domain) {
      return `https://${domain}`;
    }
    
    // Fallback to current application domain with site path
    return `${window.location.origin}/site/${website.slug}`;
  };

  const homepageUrl = getHomepageUrl();

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(homepageUrl);
      setUrlCopied(true);
      toast({ title: 'URL copied to clipboard' });
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (error) {
      toast({ 
        title: 'Failed to copy URL', 
        variant: 'destructive' 
      });
    }
  };

  const handleVisitSite = () => {
    window.open(homepageUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCreatePage = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditPage = (pageId: string) => {
    navigate(`/dashboard/websites/${id}/pages/${pageId}/builder`);
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading website...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!website) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">Website not found</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-background px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/websites')}>
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl font-semibold truncate text-foreground">{website.name}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                Help
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b px-2 sm:px-6">
          <div className="flex space-x-1 sm:space-x-8 overflow-x-auto scrollbar-hide">
            <button 
              className={`py-4 px-3 sm:px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base min-w-0 flex-shrink-0 ${
                activeTab === 'pages' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('pages')}
            >
              Pages
            </button>
            <button 
              className={`py-4 px-3 sm:px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base min-w-0 flex-shrink-0 ${
                activeTab === 'header' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('header')}
            >
              Header
            </button>
            <button 
              className={`py-4 px-3 sm:px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base min-w-0 flex-shrink-0 ${
                activeTab === 'footer' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('footer')}
            >
              Footer
            </button>
            <button 
              className={`py-4 px-3 sm:px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base min-w-0 flex-shrink-0 ${
                activeTab === 'stats' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('stats')}
            >
              Stats
            </button>
            <button 
              className={`py-4 px-3 sm:px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base min-w-0 flex-shrink-0 ${
                activeTab === 'sales' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('sales')}
            >
              Sales
            </button>
            <button 
              className={`py-4 px-3 sm:px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base min-w-0 flex-shrink-0 ${
                activeTab === 'shipping' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('shipping')}
            >
              Shipping & Delivery
            </button>
            <button 
              className={`py-4 px-3 sm:px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base min-w-0 flex-shrink-0 ${
                activeTab === 'fomo' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('fomo')}
            >
              FOMO
            </button>
            <button 
              className={`py-4 px-3 sm:px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base min-w-0 flex-shrink-0 ${
                activeTab === 'settings' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('settings')}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'pages' && (
            <>
              {/* Website URL Section */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Website URL</CardTitle>
                  <CardDescription>
                    Your website's homepage URL. Share this link with your customers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="homepage-url">Homepage URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="homepage-url"
                        value={homepageUrl}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyUrl}
                        className="px-3"
                      >
                        {urlCopied ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleVisitSite}
                        className="px-3"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">Pages</h2>
                </div>
                <Button onClick={handleCreatePage} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Page
                </Button>
              </div>

              {pages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No pages created yet</p>
                  <Button onClick={handleCreatePage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Page
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {pages.map((page) => (
                    <div key={page.id} className="group relative">
                      <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        {/* Page Preview */}
                        <div className="aspect-[3/2] sm:aspect-[4/3] bg-muted/30 relative overflow-hidden">
                          {page.preview_image_url ? (
                            <img 
                              src={page.preview_image_url} 
                              alt={`Preview of ${page.title}`}
                              className="w-full h-full object-contain bg-white"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          
                          {/* Fallback placeholder */}
                          <div className={`absolute inset-0 flex items-center justify-center ${page.preview_image_url ? 'hidden' : ''}`}>
                            <div className="text-center">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-background border-2 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded"></div>
                              </div>
                              <p className="text-xs text-muted-foreground">Page Preview</p>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="absolute top-2 left-2">
                            {page.is_homepage && (
                              <Badge variant="secondary" className="text-xs">Homepage</Badge>
                            )}
                          </div>
                          
                          {/* Published Status */}
                          {page.is_published && (
                            <div className="absolute top-2 right-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          )}

                          {/* Mobile Settings Button - Always Visible */}
                          <button
                            className="absolute top-2 right-8 sm:hidden bg-background/90 backdrop-blur-sm rounded-md p-1.5 shadow-md border hover:bg-background transition-colors"
                            aria-label="Page settings"
                            onClick={() => { setSelectedPage(page); setIsSettingsOpen(true); }}
                          >
                            <Settings className="h-3.5 w-3.5 text-foreground" />
                          </button>
                        </div>

                        {/* Page Info */}
                        <div className="p-2 sm:p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-medium truncate text-sm sm:text-base">{page.title}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {website?.connected_domain || website?.canonical_domain
                                  ? `https://${website.connected_domain || website.canonical_domain}${page.is_homepage ? '' : `/${page.slug}`}`
                                  : `/${page.slug}`
                                }
                              </p>
                            </div>
                            <button
                              className="hidden sm:flex ml-2 p-1.5 rounded-md bg-muted/40 hover:bg-muted transition-colors items-center justify-center"
                              aria-label="Page settings"
                              onClick={() => { setSelectedPage(page); setIsSettingsOpen(true); }}
                            >
                              <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                          </div>

                          <div className="flex space-x-2">
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="flex-1 text-xs sm:text-sm py-1.5 sm:py-2"
                              onClick={() => handleEditPage(page.id)}
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-1.5 sm:px-3 py-1.5 sm:py-2"
                              aria-label="Visit page"
                              onClick={() => {
                                const connectedDomain = website?.connected_domain || website?.canonical_domain;
                                const base = connectedDomain ? `https://${connectedDomain}` : `/site/${website?.slug}`;
                                const needsOrderId = page.slug === 'order-confirmation' || page.slug === 'payment-processing';
                                const url = page.is_homepage ? `${base}` : `${base}/${page.slug}${needsOrderId ? '?orderId=demo' : ''}`;
                                if (!page.is_published) {
                                  toast({ title: 'Opening unpublished page', description: 'Only visible to you while logged in.', variant: 'default' });
                                }
                                window.open(url, '_blank', 'noopener');
                              }}
                            >
                              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'header' && website && (
            <WebsiteHeaderBuilder website={website} />
          )}

          {activeTab === 'footer' && website && (
            <WebsiteFooterBuilder website={website} />
          )}

          {activeTab === 'settings' && website && (
            <WebsiteSettings website={website} />
          )}

          {activeTab === 'stats' && website && (
            <WebsiteStats 
              websiteId={website.id} 
              websiteName={website.name}
              websiteSlug={website.slug}
            />
          )}

          {activeTab === 'sales' && website && (
            <WebsiteSales 
              websiteId={website.id} 
              websiteName={website.name}
            />
          )}

          {activeTab === 'shipping' && website && (
            <WebsiteShipping website={website} />
          )}

          {activeTab === 'fomo' && website && (
            <WebsiteFOMO website={website} />
          )}

        </div>
      </div>

      <CreatePageModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        websiteId={id!}
      />

      {/* Page Settings Modal */}
      <WebsitePageSettingsModal
        open={isSettingsOpen}
        onClose={() => { setIsSettingsOpen(false); setSelectedPage(null); }}
        websiteId={id!}
        page={selectedPage}
      />
    </DashboardLayout>
  );
};

export default WebsiteManagement;