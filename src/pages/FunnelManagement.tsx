import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, ExternalLink, Settings, Eye, ArrowUp, ArrowDown, CheckCircle, Mail, BarChart3, DollarSign, GripVertical, Home, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { CreateStepModal } from '@/components/modals/CreateStepModal';
import { FunnelStats } from '@/components/funnel/FunnelStats';
import { FunnelSales } from '@/components/funnel/FunnelSales';
import { FunnelSettings } from '@/components/funnel/FunnelSettings';
import { FunnelHeaderBuilder } from '@/components/funnel/FunnelHeaderBuilder';
import { FunnelFooterBuilder } from '@/components/funnel/FunnelFooterBuilder';

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
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  meta_robots?: string;
  canonical_domain?: string;
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
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; stepId: string; stepTitle: string }>({ open: false, stepId: '', stepTitle: '' });

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

  const reorderStepsMutation = useMutation({
    mutationFn: async (reorderedSteps: FunnelStep[]) => {
      const updates = reorderedSteps.map((step, index) => ({
        id: step.id,
        step_order: index + 1
      }));

      const promises = updates.map(update =>
        supabase
          .from('funnel_steps')
          .update({ step_order: update.step_order })
          .eq('id', update.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Failed to reorder steps');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-steps', id] });
      toast({ title: 'Steps reordered successfully' });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await supabase
        .from('funnel_steps')
        .delete()
        .eq('id', stepId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-steps', id] });
      toast({ title: 'Funnel step deleted successfully' });
      setDeleteConfirm({ open: false, stepId: '', stepTitle: '' });
      // If deleted step was selected, clear selection
      if (selectedStepId === deleteConfirm.stepId) {
        setSelectedStepId(null);
      }
    },
    onError: (error: any) => {
      console.error('Error deleting step:', error);
      toast({ 
        title: 'Error deleting step',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedSteps = Array.from(steps);
    const [reorderedItem] = reorderedSteps.splice(result.source.index, 1);
    reorderedSteps.splice(result.destination.index, 0, reorderedItem);

    reorderStepsMutation.mutate(reorderedSteps);
  };

  const handleSetAsHomepage = (stepId: string) => {
    const stepToMove = steps.find(s => s.id === stepId);
    if (!stepToMove) return;

    const reorderedSteps = Array.from(steps);
    const currentIndex = reorderedSteps.findIndex(s => s.id === stepId);
    const [movedStep] = reorderedSteps.splice(currentIndex, 1);
    reorderedSteps.unshift(movedStep);

    reorderStepsMutation.mutate(reorderedSteps);
  };

  const handleCreateStep = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditStep = (stepId: string) => {
    navigate(`/dashboard/funnels/${id}/steps/${stepId}/builder`);
  };

  const handleSelectStep = (stepId: string) => {
    setSelectedStepId(stepId);
    setActiveMainTab('overview');
  };

  const handlePreviewStep = (stepId: string, stepSlug: string) => {
    // Use custom domain if connected, otherwise use system route
    const previewUrl = funnel?.canonical_domain 
      ? `https://${funnel.canonical_domain}/${stepSlug}`
      : `${window.location.origin}/funnel/${id}/${stepSlug}`;
    
    window.open(previewUrl, '_blank');
  };

  const handleDeleteStep = (stepId: string, stepTitle: string) => {
    setDeleteConfirm({ open: true, stepId, stepTitle });
  };

  const confirmDeleteStep = () => {
    if (deleteConfirm.stepId) {
      deleteStepMutation.mutate(deleteConfirm.stepId);
    }
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
        <div className="border-b bg-background px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/funnels')}>
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold">{funnel.name}</h1>
                <p className="text-muted-foreground hidden sm:block">Manage your funnel steps and settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Removed Share and Settings buttons */}
            </div>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="border-b px-4 sm:px-6">
          <div className="overflow-x-auto scrollbar-hide -mx-1 p-1">
            <div className="flex space-x-6 whitespace-nowrap">
              {[
                { id: 'steps', label: 'Steps', icon: CheckCircle },
                { id: 'stats', label: 'Stats', icon: BarChart3 },
                { id: 'sales', label: 'Sales', icon: DollarSign },
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'header', label: 'Header', icon: ArrowUp },
                { id: 'footer', label: 'Footer', icon: ArrowDown }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-3 sm:px-1 border-b-2 flex items-center gap-2 font-medium transition-colors shrink-0 text-sm sm:text-base ${
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
        </div>

        {activeTab === 'steps' && (
          <div className="flex flex-col md:flex-row">
            {/* Left Sidebar */}
            <div className="w-full md:w-80 border-r-0 md:border-r bg-muted/30 p-4 sm:p-6">
              <div className="space-y-6">
                {/* Steps Section */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium">Funnel Steps</h3>
                  </div>
                  
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="funnel-steps">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-3"
                        >
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
                              <Draggable key={step.id} draggableId={step.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                                      selectedStepId === step.id ? 'bg-primary/10 border-primary' : 'bg-background'
                                    } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                    onClick={() => handleSelectStep(step.id)}
                                  >
                                    <div className="flex-shrink-0" {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-shrink-0">
                                      <Mail className="h-4 w-4 text-blue-500" />
                                    </div>
                                     <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2">
                                         <p className="font-medium truncate">{step.title}</p>
                                         {index === 0 && (
                                           <Badge variant="secondary" className="text-xs px-1 py-0">
                                             <Home className="h-3 w-3" />
                                           </Badge>
                                         )}
                                       </div>
                                       <p className="text-sm text-muted-foreground">
                                         {getStepTypeLabel(step.step_type)}
                                       </p>
                                     </div>
                                     <div className="flex items-center gap-2">
                                       {step.is_published && (
                                         <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                       )}
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           handleDeleteStep(step.id, step.title);
                                         }}
                                         className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                         disabled={deleteStepMutation.isPending}
                                       >
                                         <Trash2 className="h-3 w-3" />
                                       </Button>
                                     </div>
                                   </div>
                                 )}
                               </Draggable>
                             ))
                           )}
                           {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  <Button 
                    onClick={handleCreateStep} 
                    className="w-full mt-4" 
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Step
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 sm:p-6">
              <div className="max-w-4xl">
                {/* Secondary Tab Navigation */}
                <div className="overflow-x-auto scrollbar-hide -mx-1 p-1 mb-6">
                  <div className="flex space-x-1 bg-muted rounded-lg p-1 whitespace-nowrap">
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'products', label: 'Products' },
                      { id: 'publishing', label: 'Publishing' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveMainTab(tab.id)}
                        className={`py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors shrink-0 ${
                          activeMainTab === tab.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content based on active main tab */}
                {activeMainTab === 'overview' && (
                  <>
                    {/* Selected Step Content */}
                    {steps.length > 0 ? (
                      (() => {
                        const selectedStep = selectedStepId 
                          ? steps.find(s => s.id === selectedStepId)
                          : steps[0];
                        
                        return selectedStep ? (
                          <div className="bg-background border rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold">{selectedStep.title}</h3>
                              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handlePreviewStep(selectedStep.id, selectedStep.slug)}
                                >
                                  <Eye className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Preview</span>
                                </Button>
                                <Button size="sm" onClick={() => handleEditStep(selectedStep.id)}>
                                  <Edit className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                              </div>
                            </div>
                            
                          <div className="bg-muted/30 rounded-lg p-8 text-center">
                              <div className="flex justify-between items-center mb-4">
                                <div className="text-left">
                                  {funnel?.canonical_domain ? (
                                    <p className="text-muted-foreground mb-2">
                                      Live URL: <code className="bg-background px-2 py-1 rounded text-sm">
                                        {funnel.canonical_domain}/{selectedStep.slug}
                                      </code>
                                    </p>
                                  ) : (
                                    <p className="text-muted-foreground mb-2">
                                      System URL: <code className="bg-background px-2 py-1 rounded text-sm">
                                        {window.location.origin}/funnel/{id}/{selectedStep.slug}
                                      </code>
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {steps.findIndex(s => s.id === selectedStep.id) > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSetAsHomepage(selectedStep.id)}
                                      disabled={reorderStepsMutation.isPending}
                                    >
                                      <Home className="h-4 w-4 mr-2" />
                                      Set as Homepage
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="bg-background border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                                <div className="text-center">
                                  <div className="w-16 h-16 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                                    <div className="w-8 h-1 bg-green-500 rounded"></div>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {getStepTypeLabel(selectedStep.step_type)} - {selectedStep.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {selectedStep.is_published ? 'Published' : 'Draft'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()
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

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="p-4 sm:p-6">
            <FunnelStats funnelId={id!} />
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="p-4 sm:p-6">
            <FunnelSales funnelId={id!} />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-4 sm:p-6">
            {funnel && <FunnelSettings funnel={funnel} />}
          </div>
        )}

        {/* Header Tab */}
        {activeTab === 'header' && (
          <div className="p-4 sm:p-6">
            {funnel && <FunnelHeaderBuilder funnel={funnel} />}
          </div>
        )}

        {/* Footer Tab */}
        {activeTab === 'footer' && (
          <div className="p-4 sm:p-6">
            {funnel && <FunnelFooterBuilder funnel={funnel} />}
          </div>
        )}

      </div>

      <CreateStepModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        funnelId={id!}
        existingSteps={steps}
      />

      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && setDeleteConfirm({ open: false, stepId: '', stepTitle: '' })}
        title="Delete Funnel Step"
        description={`Are you sure you want to delete "${deleteConfirm.stepTitle}"? This action cannot be undone and will permanently delete all associated data.`}
        confirmText="Delete Step"
        variant="destructive"
        onConfirm={confirmDeleteStep}
        isLoading={deleteStepMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default FunnelManagement;