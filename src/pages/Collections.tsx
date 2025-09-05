import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Globe, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCollections } from '@/hooks/useCollections';
import { useStoreWebsites } from '@/hooks/useStoreWebsites';
import { useAutoStore } from '@/hooks/useAutoStore';
import { CreateCollectionModal } from '@/components/modals/CreateCollectionModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function Collections() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { store } = useAutoStore();
  const { websites } = useStoreWebsites(store?.id || '');
  const { collections, loading, refetch } = useCollections(selectedWebsiteId);

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTogglePublished = async (collectionId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('collections')
        .update({ is_published: !currentStatus })
        .eq('id', collectionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Collection ${!currentStatus ? 'published' : 'unpublished'} successfully`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update collection',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      const { error } = await (supabase as any)
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Collection deleted successfully',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete collection',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout
      title="Collections"
      description="Create and manage product collections for your websites"
    >
      <div className="flex justify-end mb-6">
        <Button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="bg-primary hover:bg-primary-glow"
          disabled={!websites.length}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Collection
        </Button>
      </div>

      {!websites.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Websites Found</h3>
            <p className="text-muted-foreground mb-4">
              You need to create a website first before you can create collections.
            </p>
            <Button onClick={() => navigate('/dashboard/websites/create')}>
              Create Website
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedWebsiteId}
              onChange={(e) => setSelectedWebsiteId(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">All Websites</option>
              {websites.map((website) => (
                <option key={website.id} value={website.id}>
                  {website.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCollections.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <h3 className="text-lg font-semibold mb-2">No Collections Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedWebsiteId
                    ? 'No collections match your current filters.'
                    : 'Create your first collection to group related products.'}
                </p>
                {(!searchQuery && !selectedWebsiteId) && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    Create Collection
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCollections.map((collection) => {
                const website = websites.find(w => w.id === collection.website_id);
                return (
                  <Card key={collection.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{collection.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{website?.name}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePublished(collection.id, collection.is_published)}
                          >
                            {collection.is_published ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/dashboard/collections/${collection.id}`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCollection(collection.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {collection.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <Badge variant={collection.is_published ? "default" : "secondary"}>
                          {collection.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          /collections/{collection.slug}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        websites={websites}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />
    </DashboardLayout>
  );
}