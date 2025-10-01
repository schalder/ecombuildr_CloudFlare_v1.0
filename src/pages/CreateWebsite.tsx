import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Check, X, Loader2, AlertCircle } from 'lucide-react';
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
import { debounce } from '@/lib/utils';
import { usePlanLimits } from '@/hooks/usePlanLimits';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export default function CreateWebsite() {
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
        description: "Please upgrade your plan to create new websites.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [userProfile?.account_status, navigate, toast]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  
  // Slug validation state
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [suggestedSlug, setSuggestedSlug] = useState('');
  const [isSlugModified, setIsSlugModified] = useState(false);
  const [finalSlug, setFinalSlug] = useState('');

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
          content_type: 'website',
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

  const createWebsiteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Ensure store exists, create if necessary
      const currentStore = await getOrCreateStore();

      // Ensure slug is lowercase
      const slug = data.slug.toLowerCase();

      const { data: website, error } = await supabase
        .from('websites')
        .insert({
          store_id: currentStore.id,
          name: data.name,
          slug: slug,
          description: data.description,
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate slug error (23505 = unique constraint violation)
        if (error.code === '23505' && error.message.includes('websites_slug_key')) {
          // Generate unique slug and retry once
          const uniqueSlug = await generateUniqueSlug(slug);
          const { data: retryWebsite, error: retryError } = await supabase
            .from('websites')
            .insert({
              store_id: currentStore.id,
              name: data.name,
              slug: uniqueSlug,
              description: data.description,
            })
            .select()
            .single();
          
          if (retryError) throw retryError;
          
          // Show toast that slug was adjusted
          toast({
            title: "Slug adjusted",
            description: `The slug "${slug}" was taken. Using "${uniqueSlug}" instead.`,
          });
          
          return retryWebsite;
        }
        throw error;
      }
      return website;
    },
    onSuccess: async (website) => {
      // Get the current store to invalidate the correct cache
      const currentStore = await getOrCreateStore();
      
      // Invalidate storeWebsites cache so the new website appears immediately
      queryClient.invalidateQueries({ queryKey: ['storeWebsites', currentStore.id] });
      
      toast({
        title: "Website created",
        description: "Your website has been created successfully.",
      });
      navigate(`/dashboard/websites/${website.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create website. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const slugToUse = finalSlug || formData.slug;
    
    if (!formData.name.trim() || !slugToUse.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
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

    createWebsiteMutation.mutate({
      ...formData,
      slug: slugToUse,
    });
  };

  const handleSlugChange = (value: string) => {
    // Auto-generate slug from name if slug is empty
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/websites')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Websites
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Create New Website</CardTitle>
                <CardDescription>
                  Set up a complete website with multiple pages
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Website Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., My Business Website"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  The name of your website
                </p>
              </div>

              <div>
                <Label htmlFor="slug">Website Slug *</Label>
                <div className="relative">
                  <Input
                    id="slug"
                    placeholder="e.g., my-business"
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
                  placeholder="Brief description of your website"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>


              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/websites')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createWebsiteMutation.isPending}
                >
                  {createWebsiteMutation.isPending ? 'Creating...' : 'Create Website'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}