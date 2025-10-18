import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Check, AlertCircle, X } from 'lucide-react';
import { SEOSettingsCard } from '@/components/seo/SEOSettingsCard';
import { usePageSEO } from '@/hooks/usePageSEO';
import { validateFunnelStepSlug } from '@/lib/slugUtils';
import { debounce } from '@/lib/utils';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

interface FunnelStepSettingsPanelProps {
  stepId: string;
  funnelId: string;
  onClose: () => void;
}

interface FunnelStep {
  id: string;
  title: string;
  slug: string;
  step_type: string;
  step_order: number;
  on_success_step_id?: string;
  on_accept_step_id?: string;
  on_decline_step_id?: string;
  on_success_custom_url?: string;
  on_accept_custom_url?: string;
  on_decline_custom_url?: string;
  offer_product_id?: string;
  offer_price?: number;
  offer_quantity?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface StepNavigationProps {
  label: string;
  stepId?: string;
  customUrl?: string;
  navType: 'step' | 'url';
  onNavTypeChange: (type: 'step' | 'url') => void;
  onStepChange: (stepId: string) => void;
  onUrlChange: (url: string) => void;
  funnelSteps: FunnelStep[];
  currentStepId: string;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  label,
  stepId,
  customUrl,
  navType,
  onNavTypeChange,
  onStepChange,
  onUrlChange,
  funnelSteps,
  currentStepId
}) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Navigation Type Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={navType === 'step' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onNavTypeChange('step')}
        >
          Funnel Step
        </Button>
        <Button
          type="button"
          variant={navType === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onNavTypeChange('url')}
        >
          Custom URL
        </Button>
      </div>
      
      {/* Step Selection */}
      {navType === 'step' && (
        <Select
          value={stepId || ''}
          onValueChange={onStepChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select next step" />
          </SelectTrigger>
          <SelectContent>
            {funnelSteps
              .filter(s => s.id !== currentStepId)
              .map((funnelStep) => (
                <SelectItem key={funnelStep.id} value={funnelStep.id}>
                  {funnelStep.title} ({funnelStep.step_type})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
      
      {/* Custom URL Input */}
      {navType === 'url' && (
        <Input
          value={customUrl || ''}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://example.com"
        />
      )}
    </div>
  );
};

export const FunnelStepSettingsPanel: React.FC<FunnelStepSettingsPanelProps> = ({
  stepId,
  funnelId,
  onClose,
}) => {
  const [step, setStep] = useState<FunnelStep | null>(null);
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Slug validation state
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [suggestedSlug, setSuggestedSlug] = useState('');
  const [finalSlug, setFinalSlug] = useState('');
  const [conflictType, setConflictType] = useState<'website-system' | 'funnel' | 'error' | null>(null);
  
  // Navigation type state
  const [successNavType, setSuccessNavType] = useState<'step' | 'url'>('step');
  const [acceptNavType, setAcceptNavType] = useState<'step' | 'url'>('step');
  const [declineNavType, setDeclineNavType] = useState<'step' | 'url'>('step');
  
  const { toast } = useToast();

  // SEO hook
  const { seoData, loading: seoLoading, saving: seoSaving, saveSEOData } = usePageSEO(
    stepId, 
    step?.slug || '', 
    'funnel_step'
  );

  useEffect(() => {
    loadData();
  }, [stepId, funnelId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load current step
      const { data: stepData, error: stepError } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (stepError) throw stepError;
      setStep(stepData);
      
      // Initialize navigation type state based on existing data
      // Safe access with type checking
      setSuccessNavType((stepData as any).on_success_custom_url ? 'url' : 'step');
      setAcceptNavType((stepData as any).on_accept_custom_url ? 'url' : 'step');
      setDeclineNavType((stepData as any).on_decline_custom_url ? 'url' : 'step');

      // Load all funnel steps for navigation
      const { data: stepsData, error: stepsError } = await supabase
        .from('funnel_steps')
        .select('id, title, slug, step_type, step_order')
        .eq('funnel_id', funnelId)
        .order('step_order');

      if (stepsError) throw stepsError;
      setFunnelSteps(stepsData || []);

      // Load products for offers
      const { data: funnel } = await supabase
        .from('funnels')
        .select('store_id')
        .eq('id', funnelId)
        .single();

      if (funnel) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price')
          .eq('store_id', funnel.store_id)
          .eq('is_active', true)
          .order('name');

        if (!productsError) {
          setProducts(productsData || []);
        }
      }
    } catch (error) {
      console.error('Error loading step data:', error);
      toast({
        title: "Error",
        description: "Failed to load step settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

  // Check slug availability with domain-wide validation
  const checkSlugAvailability = async (slug: string) => {
    if (!slug.trim() || slug === step?.slug) {
      setSlugStatus('idle');
      setFinalSlug(slug);
      setSuggestedSlug('');
      return;
    }
    
    setSlugStatus('checking');
    
    try {
      // Use domain-wide slug validation
      const validation = await validateFunnelStepSlug(slug, funnelId, stepId);
      
      if (validation.hasConflict) {
        // Auto-populate the suggested slug in the input field
        setStep(prev => prev ? { ...prev, slug: validation.suggestedSlug } : null);
        setSuggestedSlug(validation.suggestedSlug);
        setFinalSlug(validation.suggestedSlug);
        setConflictType(validation.conflictType || 'funnel');
        setSlugStatus('taken');
      } else {
        setFinalSlug(validation.suggestedSlug);
        setSuggestedSlug('');
        setConflictType(null);
        setSlugStatus('available');
      }
    } catch (error) {
      console.error('Slug check error:', error);
      setSlugStatus('error');
      setSuggestedSlug('');
      setFinalSlug('');
      setConflictType('error');
    }
  };

  // Debounced slug validation
  const debouncedCheckSlug = debounce((slug: string) => checkSlugAvailability(slug), 500);

  const handleSave = async () => {
    if (!step) return;

    setSaving(true);
    try {
      // Use the final slug (with domain-wide validation applied)
      const slugToUse = finalSlug || step.slug;
      
      const { error } = await supabase
        .from('funnel_steps')
        .update({
          title: step.title,
          slug: slugToUse,
          step_type: step.step_type,
          on_success_step_id: step.on_success_step_id || null,
          on_accept_step_id: step.on_accept_step_id || null,
          on_decline_step_id: step.on_decline_step_id || null,
          offer_product_id: step.offer_product_id || null,
          offer_price: step.offer_price || null,
          offer_quantity: step.offer_quantity || 1,
        })
        .eq('id', stepId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Step settings saved successfully",
      });
      onClose();
    } catch (error) {
      console.error('Error saving step:', error);
      toast({
        title: "Error",
        description: "Failed to save step settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!step) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Step not found
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Step Settings</h2>
          <p className="text-muted-foreground">{step.title}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="w-4 h-4 mr-2" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Step Information</CardTitle>
          <CardDescription>
            Configure the basic information for this funnel step
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="step-title">Step Title</Label>
            <Input
              id="step-title"
              value={step.title}
              onChange={(e) => setStep({ ...step, title: e.target.value })}
              placeholder="Enter step title"
            />
          </div>
          
            <div className="space-y-2">
              <Label htmlFor="step-slug">URL Slug</Label>
             <div className="relative">
               <div className="flex gap-2">
                 <Input
                   id="step-slug"
                   value={step.slug}
                   onChange={(e) => {
                     const slug = generateSlug(e.target.value);
                     setStep({ ...step, slug });
                     // Reset validation state and trigger new validation
                     setSlugStatus('idle');
                     setSuggestedSlug('');
                     setFinalSlug('');
                     setConflictType(null);
                     if (slug.trim()) {
                       debouncedCheckSlug(slug);
                     }
                   }}
                   placeholder="url-slug"
                   className={`${
                     slugStatus === 'available' ? 'border-green-500' : 
                     slugStatus === 'taken' ? 'border-yellow-500' :
                     slugStatus === 'error' ? 'border-red-500' : ''
                   }`}
                 />
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     const slug = generateSlug(step.title);
                     setStep({ ...step, slug });
                     setSlugStatus('idle');
                     setSuggestedSlug('');
                     setFinalSlug('');
                     setConflictType(null);
                     if (slug.trim()) {
                       debouncedCheckSlug(slug);
                     }
                   }}
                 >
                   Generate from Title
                 </Button>
               </div>
               <div className="absolute right-3 top-1/2 -translate-y-1/2">
                 {slugStatus === 'checking' && (
                   <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                 )}
                 {slugStatus === 'available' && (
                   <Check className="h-4 w-4 text-green-600" />
                 )}
                 {slugStatus === 'taken' && (
                   <AlertCircle className="h-4 w-4 text-yellow-600" />
                 )}
                 {slugStatus === 'error' && (
                   <X className="h-4 w-4 text-red-600" />
                 )}
               </div>
             </div>
             
             {/* Status Messages */}
             {slugStatus === 'checking' && (
               <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                 <Loader2 className="h-3 w-3 animate-spin" />
                 Checking availability...
               </p>
             )}
             {slugStatus === 'available' && (
               <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                 <Check className="h-3 w-3" />
                 Slug is available
               </p>
             )}
             {slugStatus === 'taken' && suggestedSlug && (
               <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                 <AlertCircle className="h-3 w-3" />
                 {conflictType === 'website-system' 
                   ? `Slug "${step.slug}" is reserved for website pages. Using "${suggestedSlug}" instead`
                   : `Slug already exists. Using "${suggestedSlug}" instead`
                 }
               </p>
             )}
             {slugStatus === 'error' && (
               <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                 <X className="h-3 w-3" />
                 Error checking slug availability
               </p>
             )}
             
              <p className="text-sm text-muted-foreground">
                This will be used in the URL: /funnel-name/{step.slug}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="step-type">Step Type</Label>
            <Select
              value={step.step_type}
              onValueChange={(value) => setStep({ ...step, step_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landing">Landing Page</SelectItem>
                <SelectItem value="checkout">Checkout Page</SelectItem>
                <SelectItem value="upsell">Upsell Offer</SelectItem>
                <SelectItem value="downsell">Downsell Offer</SelectItem>
                <SelectItem value="thank_you">Thank You Page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {(step.step_type === 'upsell' || step.step_type === 'downsell') && (
        <Card>
          <CardHeader>
            <CardTitle>Offer Configuration</CardTitle>
            <CardDescription>
              Configure the product offer for this step
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offer-product">Offer Product</Label>
              <Select
                value={step.offer_product_id || ''}
                onValueChange={(value) => setStep({ ...step, offer_product_id: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ${product.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer-price">Offer Price</Label>
                <Input
                  id="offer-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={step.offer_price || ''}
                  onChange={(e) => setStep({ ...step, offer_price: parseFloat(e.target.value) || undefined })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer-quantity">Quantity</Label>
                <Input
                  id="offer-quantity"
                  type="number"
                  min="1"
                  value={step.offer_quantity || 1}
                  onChange={(e) => setStep({ ...step, offer_quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Step Navigation</CardTitle>
          <CardDescription>
            Configure where users go after completing actions on this step
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(step.step_type === 'landing' || step.step_type === 'checkout') && (
            <StepNavigation
              label={step.step_type === 'landing' ? 'On Success (After Checkout)' : 'On Success (After Payment)'}
              stepId={step.on_success_step_id}
              customUrl={step.on_success_custom_url}
              navType={successNavType}
              onNavTypeChange={(type) => {
                setSuccessNavType(type);
                if (type === 'step') {
                  setStep({ ...step, on_success_custom_url: undefined });
                } else {
                  setStep({ ...step, on_success_step_id: undefined });
                }
              }}
              onStepChange={(stepId) => setStep({ ...step, on_success_step_id: stepId })}
              onUrlChange={(url) => setStep({ ...step, on_success_custom_url: url })}
              funnelSteps={funnelSteps}
              currentStepId={stepId}
            />
          )}

          {(step.step_type === 'upsell' || step.step_type === 'downsell') && (
            <>
              <StepNavigation
                label="On Accept (Go To Step)"
                stepId={step.on_accept_step_id}
                customUrl={step.on_accept_custom_url}
                navType={acceptNavType}
                onNavTypeChange={(type) => {
                  setAcceptNavType(type);
                  if (type === 'step') {
                    setStep({ ...step, on_accept_custom_url: undefined });
                  } else {
                    setStep({ ...step, on_accept_step_id: undefined });
                  }
                }}
                onStepChange={(stepId) => setStep({ ...step, on_accept_step_id: stepId })}
                onUrlChange={(url) => setStep({ ...step, on_accept_custom_url: url })}
                funnelSteps={funnelSteps}
                currentStepId={stepId}
              />

              <StepNavigation
                label="On Decline (Go To Step)"
                stepId={step.on_decline_step_id}
                customUrl={step.on_decline_custom_url}
                navType={declineNavType}
                onNavTypeChange={(type) => {
                  setDeclineNavType(type);
                  if (type === 'step') {
                    setStep({ ...step, on_decline_custom_url: undefined });
                  } else {
                    setStep({ ...step, on_decline_step_id: undefined });
                  }
                }}
                onStepChange={(stepId) => setStep({ ...step, on_decline_step_id: stepId })}
                onUrlChange={(url) => setStep({ ...step, on_decline_custom_url: url })}
                funnelSteps={funnelSteps}
                currentStepId={stepId}
              />
            </>
          )}
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          {seoLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <SEOSettingsCard
              data={seoData || {}}
              onChange={(data) => saveSEOData(data)}
              pageUrl={`/funnel/${step?.slug}`}
            />
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || seoSaving}>
          {saving || seoSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
};