import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff, Plus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStoreProducts } from '@/hooks/useStoreData';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

interface Collection {
  id: string;
  website_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  is_published: boolean;
  show_on_products_page: boolean;
  image_url: string | null;
}

interface CollectionProduct {
  id: string;
  product_id: string;
  position: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: any[];
  };
}

export default function CollectionEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [collectionProducts, setCollectionProducts] = useState<CollectionProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { products } = useStoreProducts({ websiteId: collection?.website_id });

  useEffect(() => {
    if (id) {
      fetchCollection();
      fetchCollectionProducts();
    }
  }, [id]);

  useEffect(() => {
    if (collection?.website_id && products.length > 0) {
      // Filter products that are visible on this website and not already in collection
      const usedProductIds = collectionProducts.map(cp => cp.product_id);
      const available = products.filter(p => !usedProductIds.includes(p.id));
      setAvailableProducts(available);
    }
  }, [products, collectionProducts, collection?.website_id]);

  const fetchCollection = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('collections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCollection(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch collection',
        variant: 'destructive',
      });
      navigate('/dashboard/collections');
    }
  };

  const fetchCollectionProducts = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('product_collection_items')
        .select(`
          id,
          product_id,
          position,
          product:products (
            id,
            name,
            price,
            images
          )
        `)
        .eq('collection_id', id)
        .order('position');

      if (error) throw error;
      setCollectionProducts(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch collection products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!collection) return;

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('collections')
        .update({
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          is_published: collection.is_published,
          is_active: collection.is_active,
          show_on_products_page: collection.show_on_products_page,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collection.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Collection updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update collection',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (checked: boolean) => {
    if (!collection) return;

    console.log('Toggle Published - Before:', { id: collection.id, is_published: collection.is_published, new_value: checked });

    // Update local state immediately for responsive UI
    setCollection(prev => prev ? { ...prev, is_published: checked } : null);

    try {
      const { data, error } = await (supabase as any)
        .from('collections')
        .update({
          is_published: checked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collection.id)
        .select();

      console.log('Toggle Published - Database response:', { data, error });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Collection ${checked ? 'published' : 'unpublished'} successfully`,
      });
    } catch (error: any) {
      console.error('Toggle Published - Error:', error);
      // Revert local state on error
      setCollection(prev => prev ? { ...prev, is_published: !checked } : null);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update collection status',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (checked: boolean) => {
    if (!collection) return;

    console.log('Toggle Active - Before:', { id: collection.id, is_active: collection.is_active, new_value: checked });

    // Update local state immediately for responsive UI
    setCollection(prev => prev ? { ...prev, is_active: checked } : null);

    try {
      const { data, error } = await (supabase as any)
        .from('collections')
        .update({
          is_active: checked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collection.id)
        .select();

      console.log('Toggle Active - Database response:', { data, error });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Collection ${checked ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      console.error('Toggle Active - Error:', error);
      // Revert local state on error
      setCollection(prev => prev ? { ...prev, is_active: !checked } : null);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update collection status',
        variant: 'destructive',
      });
    }
  };

  const handleToggleShowOnProductsPage = async (checked: boolean) => {
    if (!collection) return;

    // Update local state immediately for responsive UI
    setCollection(prev => prev ? { ...prev, show_on_products_page: checked } : null);

    try {
      const { data, error } = await (supabase as any)
        .from('collections')
        .update({
          show_on_products_page: checked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collection.id)
        .select();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Collection ${checked ? 'will show' : 'will not show'} on products page`,
      });
    } catch (error: any) {
      console.error('Toggle Show on Products Page - Error:', error);
      // Revert local state on error
      setCollection(prev => prev ? { ...prev, show_on_products_page: !checked } : null);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update collection visibility',
        variant: 'destructive',
      });
    }
  };

  const handleAddProduct = async (productId: string) => {
    try {
      const maxPosition = Math.max(...collectionProducts.map(cp => cp.position), -1);
      
      const { error } = await (supabase as any)
        .from('product_collection_items')
        .insert({
          collection_id: id,
          product_id: productId,
          position: maxPosition + 1,
        });

      if (error) throw error;

      await fetchCollectionProducts();
      toast({
        title: 'Success',
        description: 'Product added to collection',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveProduct = async (itemId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('product_collection_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await fetchCollectionProducts();
      toast({
        title: 'Success',
        description: 'Product removed from collection',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove product',
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(collectionProducts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updates = items.map((item, index) => ({
      id: item.id,
      position: index,
    }));

    setCollectionProducts(items);

    try {
      for (const update of updates) {
        const { error } = await (supabase as any)
          .from('product_collection_items')
          .update({ position: update.position })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Product order updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order',
        variant: 'destructive',
      });
      // Revert on error
      await fetchCollectionProducts();
    }
  };

  const filteredAvailableProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout title="Edit Collection">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!collection) {
    return (
      <DashboardLayout title="Collection Not Found">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
          <Button onClick={() => navigate('/dashboard/collections')}>
            Back to Collections
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Edit Collection: ${collection.name}`}
      description="Manage collection settings and products"
    >
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/collections')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1" />
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-glow">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Collection Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Collection Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                value={collection.name}
                onChange={(e) => setCollection(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Enter collection name"
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={collection.slug}
                onChange={(e) => setCollection(prev => prev ? { ...prev, slug: e.target.value } : null)}
                placeholder="collection-slug"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={collection.description || ''}
                onChange={(e) => setCollection(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Enter collection description"
                rows={3}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-published">Published</Label>
                <p className="text-sm text-muted-foreground">
                  Make this collection visible to customers
                </p>
              </div>
              <Switch
                id="is-published"
                checked={collection.is_published}
                onCheckedChange={handleTogglePublished}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable this collection
                </p>
              </div>
              <Switch
                id="is-active"
                checked={collection.is_active}
                onCheckedChange={handleToggleActive}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-on-products-page">Show on Products Page</Label>
                <p className="text-sm text-muted-foreground">
                  Display this collection as a filter option on the products page
                </p>
              </div>
              <Switch
                id="show-on-products-page"
                checked={collection.show_on_products_page}
                onCheckedChange={handleToggleShowOnProductsPage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Products in Collection */}
        <Card>
          <CardHeader>
            <CardTitle>Products in Collection ({collectionProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="collection-products">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {collectionProducts.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-background"
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                            </div>
                            {item.product.images?.[0] && (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium">{item.product.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                ${item.product.price}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduct(item.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {collectionProducts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No products in this collection yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Products */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Add Products</CardTitle>
          <div className="relative">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAvailableProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {product.images?.[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-muted-foreground">${product.price}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddProduct(product.id)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {filteredAvailableProducts.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? 'No products found matching your search' : 'All products have been added to this collection'}
            </p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}