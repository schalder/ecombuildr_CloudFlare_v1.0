import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, ExternalLink, Settings, Eye, ArrowUp, ArrowDown, CheckCircle, Mail, BarChart3, DollarSign, Shield, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreateStepModal } from '@/components/modals/CreateStepModal';

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('steps');
  const [activeMainTab, setActiveMainTab] = useState('overview');

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
    setIsCreateModalOpen(true);
  };

  const handleEditStep = (stepId: string) => {
    navigate(`/dashboard/funnels/${id}/steps/${stepId}/builder`);
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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/funnels')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">{funnel.name}</h1>
                <p className="text-muted-foreground">Manage your funnel steps and settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="border-b px-6">
          <div className="flex space-x-8">
            {[
              { id: 'steps', label: 'Steps', icon: CheckCircle },
              { id: 'stats', label: 'Stats', icon: BarChart3 },
              { id: 'sales', label: 'Sales', icon: DollarSign },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'events', label: 'Events', icon: Activity },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 flex items-center gap-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'steps' && (
          <div className="flex">
            {/* Left Sidebar */}
            <div className="w-80 border-r bg-muted/30 p-6">
              <div className="space-y-6">
                {/* Funnel Status Cards */}
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium mb-1">Active</h4>
                          <p className="text-xs text-muted-foreground">Enable or disable the funnel</p>
                        </div>
                        <Switch
                          checked={funnel.is_active}
                          onCheckedChange={handleToggleActive}
                          disabled={updateFunnelMutation.isPending}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium mb-1">Published</h4>
                          <p className="text-xs text-muted-foreground">Make publicly accessible</p>
                        </div>
                        <Switch
                          checked={funnel.is_published}
                          onCheckedChange={handleTogglePublished}
                          disabled={updateFunnelMutation.isPending}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Steps Section */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium">Funnel Steps</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {steps.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No steps created yet</p>
                        <Button onClick={handleCreateStep} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Step
                        </Button>
                      </div>
                    ) : (
                      steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-center space-x-3 p-3 rounded-lg bg-background border cursor-pointer hover:bg-muted/50"
                          onClick={() => handleEditStep(step.id)}
                        >
                          <div className="flex-shrink-0">
                            <Mail className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{step.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {getStepTypeLabel(step.step_type)}
                            </p>
                          </div>
                          {step.is_published && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <Button 
                    onClick={handleCreateStep} 
                    className="w-full mt-4" 
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Step or Import
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <div className="max-w-4xl">
                {/* Secondary Tab Navigation */}
                <div className="flex space-x-1 mb-6 bg-muted rounded-lg p-1">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'products', label: 'Products' },
                    { id: 'publishing', label: 'Publishing' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveMainTab(tab.id)}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeMainTab === tab.id
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content based on active main tab */}
                {activeMainTab === 'overview' && (
                  <>
                    {/* Selected Step Content */}
                    {steps.length > 0 ? (
                      <div className="bg-background border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">{steps[0]?.title || 'Select a step'}</h3>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            <Button size="sm" onClick={() => handleEditStep(steps[0]?.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-muted/30 rounded-lg p-8 text-center">
                          <p className="text-muted-foreground mb-4">Please add a domain in the settings to see your Funnel live!</p>
                          <div className="bg-background border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                                <div className="w-8 h-1 bg-green-500 rounded"></div>
                              </div>
                              <p className="text-sm text-muted-foreground">Step preview will appear here</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-background border rounded-lg p-12 text-center">
                        <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
                          <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No steps yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first funnel step to get started</p>
                        <Button onClick={handleCreateStep}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Step
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {activeMainTab === 'products' && (
                  <div className="bg-background border rounded-lg p-12 text-center">
                    <h3 className="text-lg font-semibold mb-2">Products</h3>
                    <p className="text-muted-foreground">Manage products for this funnel</p>
                  </div>
                )}

                {activeMainTab === 'publishing' && (
                  <div className="bg-background border rounded-lg p-12 text-center">
                    <h3 className="text-lg font-semibold mb-2">Publishing</h3>
                    <p className="text-muted-foreground">Configure domain and publishing settings</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other tab content placeholders */}
        {activeTab !== 'steps' && (
          <div className="p-6">
            <div className="bg-background border rounded-lg p-12 text-center">
              <h3 className="text-lg font-semibold mb-2 capitalize">{activeTab}</h3>
              <p className="text-muted-foreground">Content for {activeTab} tab coming soon</p>
            </div>
          </div>
        )}
      </div>

      <CreateStepModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        funnelId={id!}
        currentStepsCount={steps.length}
      />
    </DashboardLayout>
  );
};

export default FunnelManagement;