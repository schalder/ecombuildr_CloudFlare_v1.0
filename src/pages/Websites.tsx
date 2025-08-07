import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Globe, Settings, ExternalLink, Eye, Edit, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function Websites() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store } = useUserStore();
  const queryClient = useQueryClient();

  const { data: websites, isLoading } = useQuery({
    queryKey: ['websites', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Website[];
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
        description: "The website has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete website. Please try again.",
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
    const url = website.domain 
      ? `https://${website.domain}` 
      : `/website/${website.slug}`;
    window.open(url, '_blank');
  };

  const handleDeleteWebsite = (websiteId: string) => {
    if (confirm('Are you sure you want to delete this website? This action cannot be undone.')) {
      deleteWebsiteMutation.mutate(websiteId);
    }
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
                      {website.domain || `website/${website.slug}`}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditWebsite(website.id)}
                        className="flex-1"
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
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
                        onClick={() => handleDeleteWebsite(website.id)}
                        className="text-destructive hover:text-destructive"
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
      </div>
    </DashboardLayout>
  );
}