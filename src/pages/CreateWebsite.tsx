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
import { useMutation } from '@tanstack/react-query';
import { useAutoStore } from '@/hooks/useAutoStore';
import { debounce } from '@/lib/utils';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export default function CreateWebsite() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, getOrCreateStore } = useAutoStore();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    domain: '',
  });
  
  // Slug validation state
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [suggestedSlug, setSuggestedSlug] = useState('');
  const [isSlugModified, setIsSlugModified] = useState(false);
  const [finalSlug, setFinalSlug] = useState('');

  // Generate unique slug by appending random numbers
  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    let attempts = 0;
    let uniqueSlug = baseSlug;
    
    while (attempts < 10) {
      // Get current store for checking
      const currentStore = store || await getOrCreateStore();
      if (!currentStore?.id) return baseSlug;
      
      const { data, error } = await supabase
        .from('websites')
        .select('slug')
        .eq('store_id', currentStore.id)
        .eq('slug', uniqueSlug)
        .maybeSingle();
      
      if (error || !data) {
        return uniqueSlug; // Slug is available
      }
      
      // Generate new slug with random number
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      uniqueSlug = `${baseSlug}-${randomNum}`;
      attempts++;
    }
    
    return uniqueSlug;
  };

  // Check slug availability
  const checkSlugAvailability = async (slug: string) => {
    if (!slug.trim()) return;
    
    // Try to get store, if none exists we'll create one later
    const currentStore = store || await getOrCreateStore();
    if (!currentStore?.id) return;
    
    setSlugStatus('checking');
    
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('slug')
        .eq('store_id', currentStore.id)
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) {
        setSlugStatus('error');
        return;
      }
      
      if (data) {
        // Slug is taken, generate unique one
        const uniqueSlug = await generateUniqueSlug(slug);
        setSuggestedSlug(uniqueSlug);
        setFinalSlug(uniqueSlug);
        setSlugStatus('taken');
      } else {
        // Slug is available
        setFinalSlug(slug);
        setSuggestedSlug('');
        setSlugStatus('available');
      }
    } catch (error) {
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

      const { data: website, error } = await supabase
        .from('websites')
        .insert({
          store_id: currentStore.id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          domain: data.domain || null,
        })
        .select()
        .single();

      if (error) throw error;
      return website;
    },
    onSuccess: (website) => {
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
                    Slug already exists. Using "{suggestedSlug}" instead
                  </p>
                )}
                {slugStatus === 'error' && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Error checking slug availability
                  </p>
                )}
                
                <p className="text-sm text-muted-foreground mt-1">
                  URL identifier: website/{finalSlug || formData.slug || 'your-slug'}
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

              <div>
                <Label htmlFor="domain">Custom Domain (Optional)</Label>
                <Input
                  id="domain"
                  placeholder="e.g., yourdomain.com"
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty to use the default URL
                </p>
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