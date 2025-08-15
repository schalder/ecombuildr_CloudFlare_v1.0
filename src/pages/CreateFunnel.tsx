import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '@/hooks/useUserStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStoreWebsitesForSelection } from '@/hooks/useWebsiteVisibility';

export default function CreateFunnel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store } = useUserStore();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    domain: '',
    website_id: '',
  });

  // Get websites for store
  const { websites: storeWebsites } = useStoreWebsitesForSelection(store?.id || '');

  const createFunnelMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!store?.id) throw new Error('No store selected');

      const { data: funnel, error } = await supabase
        .from('funnels')
        .insert({
          store_id: store.id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          domain: data.domain || null,
          website_id: data.website_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return funnel;
    },
    onSuccess: (funnel) => {
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
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createFunnelMutation.mutate(formData);
  };

  const handleSlugChange = (value: string) => {
    // Auto-generate slug from name if slug is empty
    const slug = value.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    
    // Auto-generate slug if slug is empty
    if (!formData.slug) {
      handleSlugChange(value);
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
                <Input
                  id="slug"
                  placeholder="e.g., product-launch"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  URL identifier: funnel/{formData.slug || 'your-slug'}
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
                <Label htmlFor="website">Website</Label>
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

              <div>
                <Label htmlFor="domain">Custom Domain (Optional)</Label>
                <Input
                  id="domain"
                  placeholder="e.g., offers.yourdomain.com"
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