import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, ExternalLink, Settings, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreatePageModal } from '@/components/modals/CreatePageModal';
import { WebsiteSettings } from '@/components/website/WebsiteSettings';
import { WebsitePageSettingsModal } from '@/components/modals/WebsitePageSettingsModal';

interface Website {
  id: string;
  name: string;
  slug: string;
  description?: string;
  domain?: string;
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
  
  const activeTab = searchParams.get('tab') || 'pages';

  const { data: website, isLoading } = useQuery({
    queryKey: ['website', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Website;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website', id] });
      toast({ title: 'Website updated successfully' });
    },
  });

  const handleToggleActive = (isActive: boolean) => {
    updateWebsiteMutation.mutate({ is_active: isActive });
  };

  const handleTogglePublished = (isPublished: boolean) => {
    updateWebsiteMutation.mutate({ is_published: isPublished });
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
        <div className="border-b bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/websites')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">{website.name}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                Help
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b px-6">
          <div className="flex space-x-8">
            <button 
              className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'pages' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('pages')}
            >
              Pages
            </button>
            <button 
              className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'stats' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('stats')}
            >
              Stats
            </button>
            <button 
              className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'sales' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('sales')}
            >
              Sales
            </button>
            <button 
              className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'security' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('security')}
            >
              Security
            </button>
            <button 
              className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'events' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('events')}
            >
              Events
            </button>
            <button 
              className={`py-4 px-1 border-b-2 font-medium transition-colors ${
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
        <div className="p-6">
          {activeTab === 'pages' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Pages</h2>
                </div>
                <Button onClick={handleCreatePage}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pages.map((page) => (
                    <div key={page.id} className="group relative">
                      <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        {/* Page Preview */}
                        <div className="aspect-[4/3] bg-muted/30 relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-background border-2 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                <div className="w-8 h-8 bg-muted rounded"></div>
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
                        </div>

                        {/* Page Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{page.title}</h3>
                              <p className="text-sm text-muted-foreground">/{page.slug}</p>
                            </div>
                            <button
                              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Page settings"
                              onClick={() => { setSelectedPage(page); setIsSettingsOpen(true); }}
                            >
                              <Settings className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>

                          <div className="flex space-x-2">
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleEditPage(page.id)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label="Visit page"
                              onClick={() => {
                                const base = `/website/${id}`;
                                const needsOrderId = page.slug === 'order-confirmation' || page.slug === 'payment-processing';
                                const url = page.is_homepage ? `${base}` : `${base}/${page.slug}${needsOrderId ? '?orderId=demo' : ''}`;
                                if (!page.is_published) {
                                  toast({ title: 'Opening unpublished page', description: 'Only visible to you while logged in.', variant: 'default' });
                                }
                                window.open(url, '_blank', 'noopener');
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
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

          {activeTab === 'settings' && website && (
            <WebsiteSettings website={website} />
          )}

          {activeTab === 'stats' && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Stats coming soon...</p>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Sales analytics coming soon...</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Security settings coming soon...</p>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Event tracking coming soon...</p>
            </div>
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