import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, ExternalLink, Settings, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Funnel {
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

interface FunnelStep {
  id: string;
  title: string;
  slug: string;
  step_type: string;
  step_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const FunnelManagement = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: funnel, isLoading } = useQuery({
    queryKey: ['funnel', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Funnel;
    },
    enabled: !!id,
  });

  const { data: steps = [] } = useQuery({
    queryKey: ['funnel-steps', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('funnel_id', id)
        .order('step_order', { ascending: true });
      
      if (error) throw error;
      return data as FunnelStep[];
    },
    enabled: !!id,
  });

  const updateFunnelMutation = useMutation({
    mutationFn: async (updates: Partial<Funnel>) => {
      const { data, error } = await supabase
        .from('funnels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel', id] });
      toast({ title: 'Funnel updated successfully' });
    },
  });

  const handleToggleActive = (isActive: boolean) => {
    updateFunnelMutation.mutate({ is_active: isActive });
  };

  const handleTogglePublished = (isPublished: boolean) => {
    updateFunnelMutation.mutate({ is_published: isPublished });
  };

  const handleCreateStep = () => {
    navigate(`/dashboard/pages/builder?funnelId=${id}`);
  };

  const handleEditStep = (stepId: string) => {
    navigate(`/dashboard/pages/builder/${stepId}?funnelId=${id}`);
  };

  const getStepTypeLabel = (stepType: string) => {
    switch (stepType) {
      case 'landing': return 'Landing Page';
      case 'checkout': return 'Checkout';
      case 'upsell': return 'Upsell';
      case 'downsell': return 'Downsell';
      case 'thank_you': return 'Thank You';
      default: return stepType;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading funnel...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!funnel) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">Funnel not found</div>
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
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/funnels')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Funnels
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{funnel.name}</h1>
              <p className="text-muted-foreground">Manage your funnel steps and settings</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            {funnel.is_published && (
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Funnel
              </Button>
            )}
          </div>
        </div>

        {/* Funnel Status */}
        <Card>
          <CardHeader>
            <CardTitle>Funnel Status</CardTitle>
            <CardDescription>Control your funnel's visibility and availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Active</h4>
                <p className="text-sm text-muted-foreground">Enable or disable the funnel</p>
              </div>
              <Switch
                checked={funnel.is_active}
                onCheckedChange={handleToggleActive}
                disabled={updateFunnelMutation.isPending}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Published</h4>
                <p className="text-sm text-muted-foreground">Make the funnel publicly accessible</p>
              </div>
              <Switch
                checked={funnel.is_published}
                onCheckedChange={handleTogglePublished}
                disabled={updateFunnelMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Funnel Steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Funnel Steps</CardTitle>
                <CardDescription>Manage the steps in your sales funnel</CardDescription>
              </div>
              <Button onClick={handleCreateStep}>
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No steps created yet</p>
                <Button onClick={handleCreateStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Step
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-xs text-muted-foreground">Step</span>
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {step.step_order}
                        </Badge>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{step.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {getStepTypeLabel(step.step_type)}
                          </Badge>
                          {step.is_published && (
                            <Badge variant="default" className="text-xs">Published</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">/{step.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-col space-y-1">
                        <Button variant="outline" size="sm" disabled={index === 0}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" disabled={index === steps.length - 1}>
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEditStep(step.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      {step.is_published && (
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

export default FunnelManagement;