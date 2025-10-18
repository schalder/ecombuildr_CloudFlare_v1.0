import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Settings, ExternalLink, Eye, Edit, Trash2, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
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
  canonical_domain?: string;
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; funnelId: string; funnelName: string }>({ open: false, funnelId: '', funnelName: '' });
  const [searchQuery, setSearchQuery] = useState('');

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
        description: "The funnel and all related data have been permanently deleted.",
      });
    },
    onError: (error: any) => {
      console.error('Delete funnel error:', error);
      
      // Check if it's our custom constraint error
      if (error.message && error.message.includes('step(s) still exist')) {
        const match = error.message.match(/(\d+) step\(s\) still exist/);
        const stepCount = match ? match[1] : 'some';
        
        toast({
          title: "Cannot delete funnel",
          description: `This funnel has ${stepCount} step(s). Please delete all steps first. This action cannot be undone.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete funnel. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ funnelId, isPublished }: { funnelId: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from('funnels')
        .update({ is_published: isPublished })
        .eq('id', funnelId);

      if (error) throw error;
    },
    onSuccess: (_, { isPublished }) => {
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
      toast({
        title: isPublished ? "Funnel published" : "Funnel unpublished",
        description: isPublished 
          ? "Your funnel is now live and ready to convert visitors." 
          : "Your funnel is now hidden from public access.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update funnel status. Please try again.",
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

  const handlePreviewFunnel = async (funnel: Funnel) => {
    try {
      // Fetch the first published funnel step
      const { data: firstStep, error } = await supabase
        .from('funnel_steps')
        .select('slug')
        .eq('funnel_id', funnel.id)
        .eq('is_published', true)
        .order('step_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching first funnel step:', error);
        toast({
          title: "Error",
          description: "Failed to load funnel preview. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!firstStep) {
        toast({
          title: "No Published Steps",
          description: "This funnel has no published steps yet.",
          variant: "destructive",
        });
        return;
      }

      // Build the correct preview URL
      let url: string;
      if (funnel.canonical_domain) {
        url = `https://${funnel.canonical_domain}/${firstStep.slug}`;
      } else if (funnel.domain) {
        url = `https://${funnel.domain}/${firstStep.slug}`;
      } else {
        url = `/funnel/${funnel.id}/${firstStep.slug}`;
      }

      window.open(url, '_blank');
    } catch (error) {
      console.error('Error in handlePreviewFunnel:', error);
      toast({
        title: "Error",
        description: "Failed to open funnel preview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFunnel = (funnelId: string, funnelName: string) => {
    setDeleteConfirm({ open: true, funnelId, funnelName });
  };

  const confirmDelete = () => {
    if (deleteConfirm.funnelId) {
      deleteFunnelMutation.mutate(deleteConfirm.funnelId);
    }
    setDeleteConfirm({ open: false, funnelId: '', funnelName: '' });
  };

  const handleTogglePublish = (funnelId: string, currentStatus: boolean) => {
    togglePublishMutation.mutate({ funnelId, isPublished: !currentStatus });
  };

  // Filter funnels based on search query
  const filteredFunnels = useMemo(() => {
    if (!funnels) return [];
    if (!searchQuery.trim()) return funnels;
    
    return funnels.filter(funnel =>
      funnel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [funnels, searchQuery]);

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Funnels</h1>
            <p className="text-muted-foreground">
              Create high-converting sales funnels with sequential landing pages
            </p>
          </div>
          <Button onClick={handleCreateFunnel}>
            <Plus className="mr-2 h-4 w-4" />
            Create Funnel
          </Button>
        </div>

        {/* Bengali Message */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
            বাংলাদেশে পেমেন্ট গেটওয়ের সীমাবদ্ধতার কারণে ইনস্ট্যান্ট পেমেন্টের সাথে ওয়ান-ক্লিক আপসেল/ডাউনসেল কাজ করে না। তাই, শুধুমাত্র ক্যাশ অন ডেলিভারি (COD) সাপোর্ট করে এমন ফানেলই এখানে কার্যকর। ব্যবহারকারীদের জন্য ক্যাশ অন ডেলিভারি (COD) দিয়েই ই-কমার্স ফানেল তৈরি করবেন।
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search funnels by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredFunnels && filteredFunnels.length > 0 ? (
          <div className="space-y-4">
            {filteredFunnels.map((funnel) => (
              <div key={funnel.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{funnel.name}</h3>
                      <div className="flex space-x-2">
                        <Badge variant={funnel.is_published ? "default" : "secondary"}>
                          {funnel.is_published ? "Live" : "Draft"}
                        </Badge>
                        <Badge variant={funnel.is_active ? "outline" : "destructive"}>
                          {funnel.is_active ? "Active" : "Paused"}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {funnel.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      {funnel.canonical_domain || funnel.domain || `funnel/${funnel.id}`}
                    </div>

                    {/* Publish Status */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg max-w-sm">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {funnel.is_published ? "Funnel is Live" : "Funnel is Hidden"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {funnel.is_published 
                            ? "Ready to convert visitors into customers" 
                            : "Publish to start collecting leads and sales"
                          }
                        </div>
                      </div>
                      <Switch
                        checked={funnel.is_published}
                        onCheckedChange={() => handleTogglePublish(funnel.id, funnel.is_published)}
                        disabled={togglePublishMutation.isPending}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditFunnel(funnel.id)}
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Manage
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
                      onClick={() => handleDeleteFunnel(funnel.id, funnel.name)}
                      className="text-destructive hover:text-destructive"
                      disabled={deleteFunnelMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery.trim() && funnels && funnels.length > 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No funnels found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No funnels match your search query "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-foreground">No funnels</h3>
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

        <ConfirmationDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => !open && setDeleteConfirm({ open: false, funnelId: '', funnelName: '' })}
          title="Delete Funnel"
          description={`Are you sure you want to delete "${deleteConfirm.funnelName}"? This action cannot be undone and will permanently delete all associated data.`}
          confirmText="Delete Funnel"
          variant="destructive"
          onConfirm={confirmDelete}
          isLoading={deleteFunnelMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
