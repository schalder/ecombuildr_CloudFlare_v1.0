import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    navigate(`/dashboard/pages/builder?websiteId=${id}`);
  };

  const handleEditPage = (pageId: string) => {
    navigate(`/dashboard/pages/builder/${pageId}?websiteId=${id}`);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/websites')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Websites
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{website.name}</h1>
              <p className="text-muted-foreground">Manage your website and its pages</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            {website.is_published && (
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
          </div>
        </div>

        {/* Website Status */}
        <Card>
          <CardHeader>
            <CardTitle>Website Status</CardTitle>
            <CardDescription>Control your website's visibility and availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Active</h4>
                <p className="text-sm text-muted-foreground">Enable or disable the website</p>
              </div>
              <Switch
                checked={website.is_active}
                onCheckedChange={handleToggleActive}
                disabled={updateWebsiteMutation.isPending}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Published</h4>
                <p className="text-sm text-muted-foreground">Make the website publicly accessible</p>
              </div>
              <Switch
                checked={website.is_published}
                onCheckedChange={handleTogglePublished}
                disabled={updateWebsiteMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Website Pages */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Website Pages</CardTitle>
                <CardDescription>Manage the pages in your website</CardDescription>
              </div>
              <Button onClick={handleCreatePage}>
                <Plus className="h-4 w-4 mr-2" />
                Add Page
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No pages created yet</p>
                <Button onClick={handleCreatePage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Page
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pages.map((page) => (
                  <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{page.title}</h4>
                          {page.is_homepage && (
                            <Badge variant="secondary" className="text-xs">Homepage</Badge>
                          )}
                          {page.is_published && (
                            <Badge variant="default" className="text-xs">Published</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">/{page.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditPage(page.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      {page.is_published && (
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WebsiteManagement;