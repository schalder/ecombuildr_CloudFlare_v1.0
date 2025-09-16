import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Upload, Save } from 'lucide-react';
import { useUserStore } from '@/hooks/useUserStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  type: 'video' | 'file' | 'text';
  url?: string;
  content?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  is_membership: boolean;
  membership_content: {
    type: 'course' | 'download';
    content: ContentItem[];
  };
}

const MembershipProductManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { store } = useUserStore();
  
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product>({
    id: '',
    name: '',
    description: '',
    price: 0,
    is_membership: true,
    membership_content: {
      type: 'course',
      content: []
    }
  });

  const addContentItem = () => {
    const newItem: ContentItem = {
      id: Date.now().toString(),
      title: '',
      type: 'video',
      url: '',
      content: ''
    };
    
    setProduct(prev => ({
      ...prev,
      membership_content: {
        ...prev.membership_content,
        content: [...prev.membership_content.content, newItem]
      }
    }));
  };

  const removeContentItem = (itemId: string) => {
    setProduct(prev => ({
      ...prev,
      membership_content: {
        ...prev.membership_content,
        content: prev.membership_content.content.filter(item => item.id !== itemId)
      }
    }));
  };

  const updateContentItem = (itemId: string, updates: Partial<ContentItem>) => {
    setProduct(prev => ({
      ...prev,
      membership_content: {
        ...prev.membership_content,
        content: prev.membership_content.content.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      }
    }));
  };

  const handleSave = async () => {
    if (!store?.id) return;

    setLoading(true);
    try {
      const productData = {
        store_id: store.id,
        name: product.name,
        description: product.description,
        price: product.price,
        is_membership: true,
        membership_content: product.membership_content as any,
        slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        is_active: true
      };

      let result;
      if (id && id !== 'new') {
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      toast.success('Membership product saved successfully!');
      navigate('/dashboard/products');
    } catch (error) {
      console.error('Error saving membership product:', error);
      toast.error('Failed to save membership product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {id === 'new' ? 'Create' : 'Edit'} Membership Product
        </h1>
        <p className="text-muted-foreground">
          Create digital courses and downloadable content for your members
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Set up the basic details for your membership product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={product.name}
                onChange={(e) => setProduct(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Digital Marketing Course"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={product.description}
                onChange={(e) => setProduct(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what members will get access to..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={product.price}
                onChange={(e) => setProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={product.membership_content.type === 'course'}
                onCheckedChange={(checked) => 
                  setProduct(prev => ({
                    ...prev,
                    membership_content: {
                      ...prev.membership_content,
                      type: checked ? 'course' : 'download'
                    }
                  }))
                }
              />
              <Label>Course (vs Download)</Label>
              <Badge variant="secondary">
                {product.membership_content.type === 'course' ? 'Course' : 'Download'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Content Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Content Items</CardTitle>
                <CardDescription>
                  Add videos, files, and text content for your members
                </CardDescription>
              </div>
              <Button onClick={addContentItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {product.membership_content.content.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No content items added yet</p>
                <Button onClick={addContentItem} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Item
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {product.membership_content.content.map((item, index) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Item {index + 1}
                          </Badge>
                          <select
                            value={item.type}
                            onChange={(e) => updateContentItem(item.id, { type: e.target.value as any })}
                            className="px-2 py-1 text-sm border rounded"
                          >
                            <option value="video">Video</option>
                            <option value="file">File</option>
                            <option value="text">Text</option>
                          </select>
                        </div>

                        <Input
                          value={item.title}
                          onChange={(e) => updateContentItem(item.id, { title: e.target.value })}
                          placeholder="Content title..."
                        />

                        {item.type === 'text' ? (
                          <Textarea
                            value={item.content || ''}
                            onChange={(e) => updateContentItem(item.id, { content: e.target.value })}
                            placeholder="Enter your text content..."
                            rows={3}
                          />
                        ) : (
                          <Input
                            value={item.url || ''}
                            onChange={(e) => updateContentItem(item.id, { url: e.target.value })}
                            placeholder={`${item.type === 'video' ? 'Video URL (YouTube, Vimeo, etc.)' : 'File URL or upload link'}`}
                          />
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContentItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/dashboard/products')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Product
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MembershipProductManager;