import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Store, Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  owner_email?: string;
}

const AdminStores = () => {
  const { isAdmin } = useAdminData();
  const { toast } = useToast();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadStores();
    }
  }, [isAdmin]);

  const loadStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          slug,
          is_active,
          created_at,
          profiles!stores_owner_id_fkey(email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const storesWithOwner = data?.map(store => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        is_active: store.is_active,
        created_at: store.created_at,
        owner_email: (store.profiles as any)?.email || 'Unknown'
      })) || [];

      setStores(storesWithOwner);
    } catch (err) {
      console.error('Error loading stores:', err);
      toast({
        title: 'Load Failed',
        description: 'Failed to load stores data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStoreStatus = async (storeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_active: !currentStatus })
        .eq('id', storeId);

      if (error) throw error;

      setStores(prev => prev.map(store =>
        store.id === storeId 
          ? { ...store, is_active: !currentStatus }
          : store
      ));

      toast({
        title: 'Status Updated',
        description: `Store ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (err) {
      console.error('Error updating store status:', err);
      toast({
        title: 'Update Failed',
        description: 'Failed to update store status.',
        variant: 'destructive',
      });
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (store.owner_email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAdmin) {
    return (
      <AdminLayout title="Store Management">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Store Management" description="Manage all stores across the platform">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                All Stores ({stores.length})
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search stores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading stores...</div>
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No stores found matching your search.' : 'No stores found.'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStores.map((store) => (
                  <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{store.name}</h4>
                        <Badge variant={store.is_active ? "default" : "secondary"}>
                          {store.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span>Slug: {store.slug}</span>
                        {store.owner_email && (
                          <span className="ml-4">Owner: {store.owner_email}</span>
                        )}
                        <span className="ml-4">
                          Created: {new Date(store.created_at).toLocaleDateString('en-US')}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={store.is_active ? "destructive" : "default"}
                      onClick={() => toggleStoreStatus(store.id, store.is_active)}
                    >
                      {store.is_active ? (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminStores;