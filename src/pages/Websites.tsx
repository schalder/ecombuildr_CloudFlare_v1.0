import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Globe, Settings, ExternalLink, Eye, Edit, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/hooks/useUserStore';

interface Website {
  id: string;
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  canonical_domain?: string;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  connected_domain?: string;
}

export default function Websites() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store } = useUserStore();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; websiteId: string; websiteName: string }>({ open: false, websiteId: '', websiteName: '' });

  const { data: websites, isLoading } = useQuery({
    queryKey: ['websites', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      
      // First get all websites
      const { data: websitesData, error: websitesError } = await supabase
        .from('websites')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (websitesError) throw websitesError;

      // Then get domain connections with custom domains
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('domain_connections')
        .select(`
          content_id,
          custom_domains (domain)
        `)
        .eq('content_type', 'website')
        .in('content_id', websitesData.map(w => w.id));

      if (connectionsError) {
        // If connections query fails, just return websites without connected domains
        return websitesData as Website[];
      }

      // Map the connected domain data
      const websitesWithDomains = websitesData.map(website => {
        const connection = connectionsData?.find(c => c.content_id === website.id);
        return {
          ...website,
          connected_domain: (connection?.custom_domains as any)?.domain || null
        };
      });

      return websitesWithDomains as Website[];
    },
    enabled: !!store?.id,
  });

  const deleteWebsiteMutation = useMutation({
    mutationFn: async (websiteId: string) => {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', websiteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      toast({
        title: "Website deleted",
        description: "The website and all related data have been permanently deleted.",
      });
    },
    onError: (error: any) => {
      console.error('Delete website error:', error);
      
      // Check if it's our custom constraint error
      if (error.message && error.message.includes('page(s) still exist')) {
        const match = error.message.match(/(\d+) page\(s\) still exist/);
        const pageCount = match ? match[1] : 'some';
        
        toast({
          title: "Cannot delete website",
          description: `This website has ${pageCount} page(s). Please delete all pages first. This action cannot be undone.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete website. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ websiteId, isPublished }: { websiteId: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from('websites')
        .update({ is_published: isPublished })
        .eq('id', websiteId);

      if (error) throw error;
    },
    onSuccess: (_, { isPublished }) => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      toast({
        title: isPublished ? "Website published" : "Website unpublished",
        description: isPublished 
          ? "Your website is now live and accessible to visitors." 
          : "Your website is now hidden from public access.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update website status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateWebsite = () => {
    navigate('/dashboard/websites/create');
  };

  const handleEditWebsite = (websiteId: string) => {
    navigate(`/dashboard/websites/${websiteId}`);
  };

  const handlePreviewWebsite = (website: Website) => {
    const connectedDomain = website.connected_domain || website.canonical_domain;
    const url = connectedDomain
      ? `https://${connectedDomain}` 
      : `/site/${website.slug}`;
    window.open(url, '_blank');
  };

  const handleDeleteWebsite = (websiteId: string, websiteName: string) => {
    setDeleteConfirm({ open: true, websiteId, websiteName });
  };

  const confirmDelete = () => {
    if (deleteConfirm.websiteId) {
      deleteWebsiteMutation.mutate(deleteConfirm.websiteId);
    }
    setDeleteConfirm({ open: false, websiteId: '', websiteName: '' });
  };

  const handleTogglePublish = (websiteId: string, currentStatus: boolean) => {
    togglePublishMutation.mutate({ websiteId, isPublished: !currentStatus });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
            <p className="text-muted-foreground">
              Create and manage complete websites with multiple pages
            </p>
          </div>
          <Button onClick={handleCreateWebsite}>
            <Plus className="mr-2 h-4 w-4" />
            Create Website
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : websites && websites.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {websites.map((website) => (
              <Card key={website.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{website.name}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {website.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Badge variant={website.is_published ? "default" : "secondary"}>
                        {website.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant={website.is_active ? "outline" : "destructive"}>
                        {website.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Globe className="mr-2 h-4 w-4" />
                      {website.connected_domain || website.canonical_domain || `site/${website.slug}`}
                    </div>

                    {/* Publish Status */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {website.is_published ? "Website is Live" : "Website is Hidden"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {website.is_published 
                            ? "Visitors can access your website" 
                            : "Publish to make it accessible to visitors"
                          }
                        </div>
                      </div>
                      <Switch
                        checked={website.is_published}
                        onCheckedChange={() => handleTogglePublish(website.id, website.is_published)}
                        disabled={togglePublishMutation.isPending}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditWebsite(website.id)}
                        className="flex-1"
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Manage
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewWebsite(website)}
                        className="flex-1"
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWebsite(website.id, website.name)}
                        className="text-destructive hover:text-destructive"
                        disabled={deleteWebsiteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No websites</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating your first website.
            </p>
            <div className="mt-6">
              <Button onClick={handleCreateWebsite}>
                <Plus className="mr-2 h-4 w-4" />
                Create Website
              </Button>
            </div>
          </div>
        )}

        <ConfirmationDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => !open && setDeleteConfirm({ open: false, websiteId: '', websiteName: '' })}
          title="Delete Website"
          description={`Are you sure you want to delete "${deleteConfirm.websiteName}"? This action cannot be undone and will permanently delete all associated data.`}
          confirmText="Delete Website"
          variant="destructive"
          onConfirm={confirmDelete}
          isLoading={deleteWebsiteMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
