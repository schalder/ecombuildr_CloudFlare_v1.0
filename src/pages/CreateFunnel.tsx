import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAutoStore } from '@/hooks/useAutoStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStoreWebsitesForSelection } from '@/hooks/useWebsiteVisibility';
import { debounce } from '@/lib/utils';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export default function CreateFunnel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, getOrCreateStore } = useAutoStore();
  const { userProfile } = usePlanLimits();
  const queryClient = useQueryClient();

  // Redirect read-only users back to dashboard
  useEffect(() => {
    if (userProfile?.account_status === 'read_only') {
      toast({
        title: "Account Access Required",
        description: "Please upgrade your plan to create new funnels.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [userProfile?.account_status, navigate, toast]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    website_id: '',
  });
  const [isPublished, setIsPublished] = useState(true);

  // Slug validation state
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [suggestedSlug, setSuggestedSlug] = useState('');
  const [isSlugModified, setIsSlugModified] = useState(false);
  const [finalSlug, setFinalSlug] = useState('');

  // Get websites for store
  const { websites: storeWebsites } = useStoreWebsitesForSelection(store?.id || '');

  // Generate unique slug by appending random characters
  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
  };

  // Check slug availability globally using RPC
  const checkSlugAvailability = async (slug: string) => {
    if (!slug.trim()) return;
    
    setSlugStatus('checking');
    
    try {
      // Use RPC to check globally (bypasses RLS)
      const { data: isAvailable, error } = await supabase
        .rpc('slug_is_available', {
          content_type: 'funnel',
          slug_value: slug.toLowerCase()
        });
      
      if (error) {
        console.error('Slug check error:', error);
        setSlugStatus('error');
        return;
      }
      
      if (!isAvailable) {
        // Slug is taken globally, generate unique one
        const uniqueSlug = await generateUniqueSlug(slug);
        setSuggestedSlug(uniqueSlug);
        setFinalSlug(uniqueSlug);
        setSlugStatus('taken');
      } else {
        // Slug is available globally
        setFinalSlug(slug);
        setSuggestedSlug('');
        setSlugStatus('available');
      }
    } catch (error) {
      console.error('Slug check error:', error);
      setSlugStatus('error');
    }
  };

  // Debounced slug validation
  const debouncedCheckSlug = useCallback(
    debounce((slug: string) => checkSlugAvailability(slug), 500),
    [store?.id, getOrCreateStore]
  );

  const createFunnelMutation = useMutation({
    mutationFn: async (data: typeof formData & { isPublished: boolean }) => {
      // Ensure store exists, create if necessary
      const currentStore = await getOrCreateStore();

      // Ensure slug is lowercase
      const slug = data.slug.toLowerCase();

      const { data: funnel, error } = await supabase
        .from('funnels')
        .insert({
          store_id: currentStore.id,
          name: data.name,
          slug: slug,
          description: data.description,
          website_id: data.website_id || null,
          is_published: data.isPublished,
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate slug error (23505 = unique constraint violation)
        if (error.code === '23505' && error.message.includes('funnels_slug_key')) {
          // Generate unique slug and retry once
          const uniqueSlug = await generateUniqueSlug(slug);
          const { data: retryFunnel, error: retryError } = await supabase
            .from('funnels')
            .insert({
              store_id: currentStore.id,
              name: data.name,
              slug: uniqueSlug,
              description: data.description,
              website_id: data.website_id || null,
            })
            .select()
            .single();
          
          if (retryError) throw retryError;
          
          // Show toast that slug was adjusted
          toast({
            title: "Slug adjusted",
            description: `The slug "${slug}" was taken. Using "${uniqueSlug}" instead.`,
          });
          
          return retryFunnel;
        }
        throw error;
      }
      return funnel;
    },
    onSuccess: async (funnel) => {
      // Get the current store to invalidate the correct cache
      const currentStore = await getOrCreateStore();
      
      // Invalidate storeFunnels cache so the new funnel appears immediately
      queryClient.invalidateQueries({ queryKey: ['storeFunnels', currentStore.id] });
      
      toast({
        title: "Funnel created",
        description: "Your funnel has been created successfully.",
      });
      navigate(`/dashboard/funnels/${funnel.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create funnel. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const slugToUse = finalSlug || formData.slug;
    
    if (!formData.name.trim() || !slugToUse.trim() || !formData.website_id.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including website selection.",
        variant: "destructive",
      });
      return;
    }

    if (slugStatus === 'taken' && !finalSlug) {
      toast({
        title: "Error",
        description: "Please wait for slug validation to complete.",
        variant: "destructive",
      });
      return;
    }

    createFunnelMutation.mutate({
      ...formData,
      slug: slugToUse,
      isPublished,
    });
  };

  const handleSlugChange = (value: string) => {
    const slug = value.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    setFormData(prev => ({ ...prev, slug }));
    setIsSlugModified(true);
    
    // Reset validation state and trigger new validation
    setSlugStatus('idle');
    setSuggestedSlug('');
    setFinalSlug('');
    
    if (slug.trim()) {
      debouncedCheckSlug(slug);
    }
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    
    // Auto-generate slug if slug is empty or hasn't been modified by user
    if (!formData.slug || !isSlugModified) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      setFormData(prev => ({ ...prev, slug }));
      
      // Reset validation state and trigger new validation
      setSlugStatus('idle');
      setSuggestedSlug('');
      setFinalSlug('');
      
      if (slug.trim()) {
        debouncedCheckSlug(slug);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/funnels')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Funnels
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Create New Funnel</CardTitle>
                <CardDescription>
                  Build a high-converting sales funnel with sequential landing pages
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Funnel Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Product Launch Funnel"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  The name of your sales funnel
                </p>
              </div>

              <div>
                <Label htmlFor="slug">Funnel Slug *</Label>
                <div className="relative">
                  <Input
                    id="slug"
                    placeholder="e.g., product-launch"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    required
                    className={`pr-10 ${
                      slugStatus === 'available' ? 'border-green-500' : 
                      slugStatus === 'taken' ? 'border-yellow-500' :
                      slugStatus === 'error' ? 'border-red-500' : ''
                    }`}
                  />
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
                  <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Slug already exists globally. Using "{suggestedSlug}" instead
                  </p>
                )}
                {slugStatus === 'error' && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Error checking slug availability
                  </p>
                )}
                
                <p className="text-sm text-muted-foreground mt-1">
                  System URL: site/{finalSlug || formData.slug || 'your-slug'}
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your funnel and its purpose"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="website">Website *</Label>
                <Select value={formData.website_id} onValueChange={(value) => setFormData(prev => ({ ...prev, website_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a website for this funnel" />
                  </SelectTrigger>
                  <SelectContent>
                    {storeWebsites.map((website) => (
                      <SelectItem key={website.id} value={website.id}>
                        {website.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose which website this funnel belongs to for consistent branding
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="funnel-publish-toggle" className="text-base font-medium">
                    Publish Funnel
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {isPublished
                      ? "Your funnel will be live and ready to convert visitors immediately."
                      : "Keep as draft – you can publish it later from the funnel management page."}
                  </p>
                </div>
                <Switch
                  id="funnel-publish-toggle"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/funnels')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createFunnelMutation.isPending}
                >
                  {createFunnelMutation.isPending ? 'Creating...' : 'Create Funnel'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}