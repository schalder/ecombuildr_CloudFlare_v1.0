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
import { ArrowLeft, Plus, Edit, ExternalLink, Settings, Eye, ArrowUp, ArrowDown, CheckCircle, Mail, BarChart3, DollarSign, GripVertical, Home, Trash2, Copy, CheckIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { CreateStepModal } from '@/components/modals/CreateStepModal';
import { FunnelStepSettingsModal } from '@/components/modals/FunnelStepSettingsModal';
import { FunnelStats } from '@/components/funnel/FunnelStats';
import { FunnelSales } from '@/components/funnel/FunnelSales';
import { FunnelSettings } from '@/components/funnel/FunnelSettings';
import { FunnelHeaderBuilder } from '@/components/funnel/FunnelHeaderBuilder';
import { FunnelFooterBuilder } from '@/components/funnel/FunnelFooterBuilder';
import { useHTMLGeneration } from '@/hooks/useHTMLGeneration';
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
  preview_image_url?: string;
}
const FunnelManagement = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const { deleteHTMLSnapshot } = useHTMLGeneration();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('steps');
  const [urlCopied, setUrlCopied] = useState(false);
  
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    stepId: string;
    stepTitle: string;
  }>({
    open: false,
    stepId: '',
    stepTitle: ''
  });
  const {
    data: funnel,
    isLoading
  } = useQuery({
    queryKey: ['funnel', id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('funnels').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Funnel;
    },
    enabled: !!id
  });
  const {
    data: steps = []
  } = useQuery({
    queryKey: ['funnel-steps', id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('funnel_steps').select('*').eq('funnel_id', id).order('step_order', {
        ascending: true
      });
      if (error) throw error;
      return data as FunnelStep[];
    },
    enabled: !!id
  });
  const updateFunnelMutation = useMutation({
    mutationFn: async (updates: Partial<Funnel>) => {
      const {
        data,
        error
      } = await supabase.from('funnels').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['funnel', id]
      });
      toast({
        title: 'Funnel updated successfully'
      });
    }
  });
  const reorderStepsMutation = useMutation({
    mutationFn: async (reorderedSteps: FunnelStep[]) => {
      const stepIds = reorderedSteps.map(step => step.id);
      const newOrders = reorderedSteps.map((_, index) => index + 1);
      
      const { error } = await supabase.rpc('reorder_funnel_steps', {
        step_ids: stepIds,
        new_orders: newOrders
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['funnel-steps', id]
      });
      toast({
        title: 'Steps reordered successfully'
      });
    }
  });
  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const {
        error
      } = await supabase.from('funnel_steps').delete().eq('id', stepId);
      if (error) throw error;
    },
    onSuccess: async () => {
      // Clean up HTML snapshots as defense-in-depth
      if (deleteConfirm.stepId) {
        await deleteHTMLSnapshot(deleteConfirm.stepId, 'funnel_step');
      }
      queryClient.invalidateQueries({
        queryKey: ['funnel-steps', id]
      });
      toast({
        title: 'Funnel step deleted successfully'
      });
      setDeleteConfirm({
        open: false,
        stepId: '',
        stepTitle: ''
      });
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
    if (result.source.index === result.destination.index) return; // No change guard
    
    const reorderedSteps = Array.from(steps);
    const [reorderedItem] = reorderedSteps.splice(result.source.index, 1);
    reorderedSteps.splice(result.destination.index, 0, reorderedItem);
    
    // Optimistic update to React Query cache
    queryClient.setQueryData(['funnel-steps', id], reorderedSteps);
    
    reorderStepsMutation.mutate(reorderedSteps, {
      onError: () => {
        // Rollback on error by refetching
        queryClient.invalidateQueries({ queryKey: ['funnel-steps', id] });
      }
    });
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
  };
  const handlePreviewStep = (stepId: string, stepSlug: string) => {
    // Use custom domain if connected, otherwise use system route
    const previewUrl = funnel?.canonical_domain ? `https://${funnel.canonical_domain}/${stepSlug}` : `${window.location.origin}/funnel/${id}/${stepSlug}`;
    window.open(previewUrl, '_blank');
  };
  const handleDeleteStep = (stepId: string, stepTitle: string) => {
    setDeleteConfirm({
      open: true,
      stepId,
      stepTitle
    });
  };
  const confirmDeleteStep = () => {
    if (deleteConfirm.stepId) {
      deleteStepMutation.mutate(deleteConfirm.stepId);
    }
  };
  const getStepTypeLabel = (stepType: string) => {
    switch (stepType) {
      case 'landing':
        return 'Landing Page';
      case 'checkout':
        return 'Checkout';
      case 'upsell':
        return 'Upsell';
      case 'downsell':
        return 'Downsell';
      case 'thank_you':
        return 'Thank You';
      default:
        return stepType;
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
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
  if (isLoading) {
    return <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading funnel...</div>
        </div>
      </DashboardLayout>;
  }
  if (!funnel) {
    return <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">Funnel not found</div>
        </div>
      </DashboardLayout>;
  }
  return <DashboardLayout>
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
              {[{
              id: 'steps',
              label: 'Steps',
              icon: CheckCircle
            }, {
              id: 'stats',
              label: 'Stats',
              icon: BarChart3
            }, {
              id: 'sales',
              label: 'Sales',
              icon: DollarSign
            }, {
              id: 'settings',
              label: 'Settings',
              icon: Settings
            }, {
              id: 'header',
              label: 'Header',
              icon: ArrowUp
            }, {
              id: 'footer',
              label: 'Footer',
              icon: ArrowDown
            }].map(tab => {
              const Icon = tab.icon;
              return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 px-3 sm:px-1 border-b-2 flex items-center gap-2 font-medium transition-colors shrink-0 text-sm sm:text-base ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>;
            })}
            </div>
          </div>
        </div>

        {activeTab === 'steps' && <div className="flex flex-col md:flex-row">
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
                      {provided => <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                          {steps.length === 0 ? <div className="text-center py-8">
                              <p className="text-muted-foreground mb-4">No steps created yet</p>
                              <Button onClick={handleCreateStep} size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Step
                              </Button>
                            </div> : steps.map((step, index) => <Draggable key={step.id} draggableId={step.id} index={index}>
                                {(provided, snapshot) => <div ref={provided.innerRef} {...provided.draggableProps} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${selectedStepId === step.id ? 'bg-primary/10 border-primary' : 'bg-background'} ${snapshot.isDragging ? 'shadow-lg' : ''}`} onClick={() => handleSelectStep(step.id)}>
                                     <div className="flex-shrink-0" {...provided.dragHandleProps}>
                                       <GripVertical className="h-4 w-4 text-muted-foreground" />
                                     </div>
                                     
                                     
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="truncate text-xs font-bold">{step.title}</p>
                                          {index === 0 && <Badge variant="secondary" className="text-xs px-1 py-0">
                                              <Home className="h-3 w-3" />
                                            </Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {getStepTypeLabel(step.step_type)}
                                        </p>
                                      </div>
                                     <div className="flex items-center gap-2">
                                       {step.is_published && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                                       <Button variant="ghost" size="sm" onClick={e => {
                            e.stopPropagation();
                            handleDeleteStep(step.id, step.title);
                          }} className="text-destructive hover:text-destructive h-8 w-8 p-0" disabled={deleteStepMutation.isPending}>
                                         <Trash2 className="h-3 w-3" />
                                       </Button>
                                     </div>
                                   </div>}
                               </Draggable>)}
                           {provided.placeholder}
                        </div>}
                    </Droppable>
                  </DragDropContext>

                  <Button onClick={handleCreateStep} className="w-full mt-4" variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Step
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 sm:p-6">
              <div className="max-w-4xl">
                {/* Main Content - Steps Overview */}
                <>
                    {/* Selected Step Content */}
                    {steps.length > 0 ? (() => {
                const selectedStep = selectedStepId ? steps.find(s => s.id === selectedStepId) : steps[0];
                return selectedStep ? <div className="bg-background border rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold">{selectedStep.title}</h3>
                              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                                <Button variant="outline" size="sm" onClick={() => handlePreviewStep(selectedStep.id, selectedStep.slug)}>
                                  <Eye className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Preview</span>
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
                                  <Settings className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Settings</span>
                                </Button>
                                <Button size="sm" onClick={() => handleEditStep(selectedStep.id)}>
                                  <Edit className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                              </div>
                            </div>
                            
                          <div className="bg-muted/30 rounded-lg p-8 text-center">
                              <div className="flex justify-between items-center mb-4">
                                <div className="text-left flex-1">
                                  {funnel?.canonical_domain ? (
                                    <div className="mb-2">
                                      <p className="text-muted-foreground mb-1">Live URL:</p>
                                      <div className="flex items-center gap-2">
                                        <code className="bg-background px-2 py-1 rounded text-sm flex-1">
                                          {funnel.canonical_domain}/{selectedStep.slug}
                                        </code>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleCopyUrl(`https://${funnel.canonical_domain}/${selectedStep.slug}`)}
                                          className="px-3"
                                        >
                                          {urlCopied ? (
                                            <CheckIcon className="h-4 w-4" />
                                          ) : (
                                            <Copy className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mb-2">
                                      <p className="text-muted-foreground mb-1">System URL:</p>
                                      <div className="flex items-center gap-2">
                                        <code className="bg-background px-2 py-1 rounded text-sm flex-1">
                                          {window.location.origin}/funnel/{id}/{selectedStep.slug}
                                        </code>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleCopyUrl(`${window.location.origin}/funnel/${id}/${selectedStep.slug}`)}
                                          className="px-3"
                                        >
                                          {urlCopied ? (
                                            <CheckIcon className="h-4 w-4" />
                                          ) : (
                                            <Copy className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {steps.findIndex(s => s.id === selectedStep.id) > 0 && <Button variant="outline" size="sm" onClick={() => handleSetAsHomepage(selectedStep.id)} disabled={reorderStepsMutation.isPending}>
                                      <Home className="h-4 w-4 mr-2" />
                                      Set as Homepage
                                    </Button>}
                                </div>
                              </div>
                              <div className="bg-background border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden">
                                {selectedStep.preview_image_url ? <div className="relative aspect-[16/9] max-w-md mx-auto bg-white">
                                    <img src={selectedStep.preview_image_url} alt={`Preview of ${selectedStep.title}`} className="w-full h-full object-contain" onError={e => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                                    <div className="absolute bottom-4 left-4 text-white">
                                      <p className="text-sm font-medium">
                                        {getStepTypeLabel(selectedStep.step_type)} - {selectedStep.title}
                                      </p>
                                      <p className="text-xs opacity-90">
                                        {selectedStep.is_published ? 'Published' : 'Draft'}
                                      </p>
                                    </div>
                                  </div> : null}
                                <div className={`p-8 text-center ${selectedStep.preview_image_url ? 'hidden' : 'block'}`} style={{
                        display: selectedStep.preview_image_url ? 'none' : 'block'
                      }}>
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
                          </div> : null;
              })() : <div className="bg-background border rounded-lg p-12 text-center">
                        <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
                          <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No steps yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first funnel step to get started</p>
                        <Button onClick={handleCreateStep}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Step
                        </Button>
                      </div>}
                   </>
              </div>
            </div>
          </div>}

        {/* Stats Tab */}
        {activeTab === 'stats' && <div className="p-4 sm:p-6">
            <FunnelStats funnelId={id!} />
          </div>}

        {/* Sales Tab */}
        {activeTab === 'sales' && <div className="p-4 sm:p-6">
            <FunnelSales funnelId={id!} />
          </div>}

        {/* Settings Tab */}
        {activeTab === 'settings' && <div className="p-4 sm:p-6">
            {funnel && <FunnelSettings funnel={funnel} />}
          </div>}

        {/* Header Tab */}
        {activeTab === 'header' && <div className="p-4 sm:p-6">
            {funnel && <FunnelHeaderBuilder funnel={funnel} />}
          </div>}

        {/* Footer Tab */}
        {activeTab === 'footer' && <div className="p-4 sm:p-6">
            {funnel && <FunnelFooterBuilder funnel={funnel} />}
          </div>}

      </div>

      {/* Create Step Modal */}
      <CreateStepModal
        funnelId={id!}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Step Settings Modal */}
      {selectedStepId && (
        <FunnelStepSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          stepId={selectedStepId}
          funnelId={id!}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Delete Funnel Step"
        description={`Are you sure you want to delete "${deleteConfirm.stepTitle}"? This action cannot be undone.`}
        confirmText="Delete Step"
        cancelText="Cancel"
        onConfirm={confirmDeleteStep}
        isLoading={deleteStepMutation.isPending}
        variant="destructive"
      />
    </DashboardLayout>;
};
export default FunnelManagement;