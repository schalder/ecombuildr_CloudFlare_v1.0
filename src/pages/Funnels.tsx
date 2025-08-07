import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Settings, ExternalLink, Eye, Edit, Trash2, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/hooks/useUserStore';

interface Funnel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  settings: any;
}

export default function Funnels() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store } = useUserStore();
  const queryClient = useQueryClient();

  const { data: funnels, isLoading } = useQuery({
    queryKey: ['funnels', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Funnel[];
    },
    enabled: !!store?.id,
  });

  const deleteFunnelMutation = useMutation({
    mutationFn: async (funnelId: string) => {
      const { error } = await supabase
        .from('funnels')
        .delete()
        .eq('id', funnelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
      toast({
        title: "Funnel deleted",
        description: "The funnel has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete funnel. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateFunnel = () => {
    navigate('/dashboard/funnels/create');
  };

  const handleEditFunnel = (funnelId: string) => {
    navigate(`/dashboard/funnels/${funnelId}`);
  };

  const handlePreviewFunnel = (funnel: Funnel) => {
    const url = funnel.domain 
      ? `https://${funnel.domain}` 
      : `/funnel/${funnel.slug}`;
    window.open(url, '_blank');
  };

  const handleViewAnalytics = (funnelId: string) => {
    navigate(`/dashboard/funnels/${funnelId}/analytics`);
  };

  const handleDeleteFunnel = (funnelId: string) => {
    if (confirm('Are you sure you want to delete this funnel? This action cannot be undone.')) {
      deleteFunnelMutation.mutate(funnelId);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Funnels</h1>
            <p className="text-muted-foreground">
              Create high-converting sales funnels with sequential landing pages
            </p>
          </div>
          <Button onClick={handleCreateFunnel}>
            <Plus className="mr-2 h-4 w-4" />
            Create Funnel
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
        ) : funnels && funnels.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {funnels.map((funnel) => (
              <Card key={funnel.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{funnel.name}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {funnel.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Badge variant={funnel.is_published ? "default" : "secondary"}>
                        {funnel.is_published ? "Live" : "Draft"}
                      </Badge>
                      <Badge variant={funnel.is_active ? "outline" : "destructive"}>
                        {funnel.is_active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      {funnel.domain || `funnel/${funnel.slug}`}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditFunnel(funnel.id)}
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewFunnel(funnel)}
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAnalytics(funnel.id)}
                      >
                        <BarChart3 className="mr-2 h-3 w-3" />
                        Analytics
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFunnel(funnel.id)}
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
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No funnels</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating your first sales funnel.
            </p>
            <div className="mt-6">
              <Button onClick={handleCreateFunnel}>
                <Plus className="mr-2 h-4 w-4" />
                Create Funnel
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}