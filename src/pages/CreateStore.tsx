import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { ThemeSelector } from '@/components/ThemeSelector';

const CreateStore = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    primary_color: '#10B981',
    secondary_color: '#059669',
    theme_id: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 50);
      
      setFormData(prev => ({
        ...prev,
        slug: slug
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        title: "Error",
        description: "Store name and slug are required",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Check if slug is already taken
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', formData.slug)
        .single();

      if (existingStore) {
        toast({
          title: "Error",
          description: "This store URL is already taken. Please choose a different one.",
          variant: "destructive"
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create the store
      const { data: store, error } = await supabase
        .from('stores')
        .insert({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          theme_id: formData.theme_id || null,
          owner_id: user.id,
          is_active: true,
          settings: {}
        })
        .select()
        .single();

      if (error) throw error;

      // Create a default homepage for the store
      await supabase
        .from('pages')
        .insert({
          store_id: store.id,
          title: 'Home',
          slug: 'home',
          is_homepage: true,
          is_published: true,
          content: {
            sections: [
              {
                type: 'hero',
                title: `Welcome to ${formData.name}`,
                subtitle: 'Discover our amazing products',
                backgroundImage: '',
                ctaText: 'Shop Now',
                ctaLink: `/store/${formData.slug}/products`
              }
            ]
          }
        });

      toast({
        title: "Success",
        description: "Store created successfully!"
      });

      navigate(`/dashboard/stores/${store.id}`);
    } catch (error: any) {
      console.error('Error creating store:', error);
      toast({
        title: "Error",
        description: "Failed to create store",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Create New Store" description="Set up your new online store">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard/stores')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle>Create New Store</CardTitle>
                <CardDescription>Enter your store details to get started</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="theme">Choose Theme</TabsTrigger>
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Store Name *</Label>
                    <Input
                      id="name"
                      placeholder="My Awesome Store"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Store URL *</Label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">/store/</span>
                      <Input
                        id="slug"
                        placeholder="my-awesome-store"
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will be your store's web address. Only letters, numbers, and hyphens allowed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Store Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell customers what your store is about..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="theme" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Choose Your Store Theme</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select a theme that matches your brand. You can change this later.
                    </p>
                    <ThemeSelector 
                      selectedThemeId={formData.theme_id}
                      onThemeSelect={(themeId) => setFormData(prev => ({ ...prev, theme_id: themeId }))}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="colors" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          id="primary_color"
                          value={formData.primary_color}
                          onChange={(e) => handleInputChange('primary_color', e.target.value)}
                          className="w-10 h-10 rounded border"
                        />
                        <Input
                          value={formData.primary_color}
                          onChange={(e) => handleInputChange('primary_color', e.target.value)}
                          placeholder="#10B981"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          id="secondary_color"
                          value={formData.secondary_color}
                          onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                          className="w-10 h-10 rounded border"
                        />
                        <Input
                          value={formData.secondary_color}
                          onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                          placeholder="#059669"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex space-x-4 pt-6 border-t">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Store'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard/stores')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateStore;