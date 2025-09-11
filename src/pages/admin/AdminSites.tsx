import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Zap, Search, AlertCircle, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

// Website and Funnel data interfaces
interface WebsiteData {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  owner_email?: string;
  owner_name?: string;
  store_name?: string;
}

interface FunnelData {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  owner_email?: string;
  owner_name?: string;
  store_name?: string;
}

export default function AdminSites() {
  const { isAdmin, loading: adminLoading } = useAdminData();
  const [websites, setWebsites] = useState<WebsiteData[]>([]);
  const [funnels, setFunnels] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination states
  const [websitePage, setWebsitePage] = useState(1);
  const [funnelPage, setFunnelPage] = useState(1);
  const [websiteTotal, setWebsiteTotal] = useState(0);
  const [funnelTotal, setFunnelTotal] = useState(0);
  const itemsPerPage = 30;
  
  // Delete dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'website' | 'funnel';
    id: string;
    name: string;
  }>({
    open: false,
    type: 'website',
    id: '',
    name: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchWebsites();
      fetchFunnels();
    }
  }, [isAdmin, websitePage, funnelPage]);
  
  // Reset page when search term changes
  useEffect(() => {
    setWebsitePage(1);
    setFunnelPage(1);
  }, [searchTerm]);

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      
      // First get total count for pagination
      const { count: totalCount } = await supabase
        .from('websites')
        .select('*', { count: 'exact', head: true });
      
      setWebsiteTotal(totalCount || 0);
      
      // Fetch paginated websites
      const from = (websitePage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data: websitesData, error } = await supabase
        .from('websites')
        .select('id, name, slug, domain, is_active, is_published, created_at, store_id')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Get store and owner data separately
      const storeIds = websitesData?.map(w => w.store_id).filter(Boolean) || [];
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, name, owner_id')
        .in('id', storeIds);

      const ownerIds = storesData?.map(s => s.owner_id).filter(Boolean) || [];
      const { data: ownersData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', ownerIds);

      const storeMap = new Map(storesData?.map(s => [s.id, s]) || []);
      const ownerMap = new Map(ownersData?.map(o => [o.id, o]) || []);

      const formattedWebsites = websitesData?.map(site => {
        const store = storeMap.get(site.store_id);
        const owner = store ? ownerMap.get(store.owner_id) : null;
        
        return {
          id: site.id,
          name: site.name,
          slug: site.slug,
          domain: site.domain,
          is_active: site.is_active,
          is_published: site.is_published,
          created_at: site.created_at,
          owner_email: owner?.email || 'N/A',
          owner_name: owner?.full_name || 'N/A',
          store_name: store?.name || 'N/A'
        };
      }) || [];

      setWebsites(formattedWebsites);
    } catch (error) {
      console.error('Error fetching websites:', error);
      toast.error('Failed to fetch websites');
    } finally {
      setLoading(false);
    }
  };

  const fetchFunnels = async () => {
    try {
      setLoading(true);
      
      // First get total count for pagination
      const { count: totalCount } = await supabase
        .from('funnels')
        .select('*', { count: 'exact', head: true });
      
      setFunnelTotal(totalCount || 0);
      
      // Fetch paginated funnels
      const from = (funnelPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data: funnelsData, error } = await supabase
        .from('funnels')
        .select('id, name, slug, domain, is_active, is_published, created_at, store_id')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Get store and owner data separately
      const storeIds = funnelsData?.map(f => f.store_id).filter(Boolean) || [];
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, name, owner_id')
        .in('id', storeIds);

      const ownerIds = storesData?.map(s => s.owner_id).filter(Boolean) || [];
      const { data: ownersData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', ownerIds);

      const storeMap = new Map(storesData?.map(s => [s.id, s]) || []);
      const ownerMap = new Map(ownersData?.map(o => [o.id, o]) || []);

      const formattedFunnels = funnelsData?.map(funnel => {
        const store = storeMap.get(funnel.store_id);
        const owner = store ? ownerMap.get(store.owner_id) : null;
        
        return {
          id: funnel.id,
          name: funnel.name,
          slug: funnel.slug,
          domain: funnel.domain,
          is_active: funnel.is_active,
          is_published: funnel.is_published,
          created_at: funnel.created_at,
          owner_email: owner?.email || 'N/A',
          owner_name: owner?.full_name || 'N/A',
          store_name: store?.name || 'N/A'
        };
      }) || [];

      setFunnels(formattedFunnels);
    } catch (error) {
      console.error('Error fetching funnels:', error);
      toast.error('Failed to fetch funnels');
    } finally {
      setLoading(false);
    }
  };

  const toggleWebsiteStatus = async (websiteId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('websites')
        .update({ is_active: newStatus })
        .eq('id', websiteId);

      if (error) throw error;

      setWebsites(prev => prev.map(website =>
        website.id === websiteId 
          ? { ...website, is_active: newStatus }
          : website
      ));

      toast.success(`Website ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating website status:', error);
      toast.error('Failed to update website status');
    }
  };

  const toggleFunnelStatus = async (funnelId: string, newStatus: boolean) => {
    try {
      // Update the funnel directly
      const { error } = await supabase
        .from('funnels')
        .update({ is_active: newStatus })
        .eq('id', funnelId);

      if (error) throw error;

      setFunnels(prev => prev.map(funnel =>
        funnel.id === funnelId 
          ? { ...funnel, is_active: newStatus }
          : funnel
      ));

      toast.success(`Funnel ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating funnel status:', error);
      toast.error('Failed to update funnel status');
    }
  };

  const handleDeleteWebsite = async () => {
    if (!deleteDialog.id) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase.rpc('delete_website_admin', {
        p_website_id: deleteDialog.id
      });

      if (error) throw error;

      // Remove from local state
      setWebsites(prev => prev.filter(w => w.id !== deleteDialog.id));
      setDeleteDialog({ open: false, type: 'website', id: '', name: '' });
      toast.success('Website deleted successfully');
      
      // Refresh to update totals
      fetchWebsites();
    } catch (error: any) {
      console.error('Error deleting website:', error);
      toast.error(error.message || 'Failed to delete website');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteFunnel = async () => {
    if (!deleteDialog.id) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('funnels')
        .delete()
        .eq('id', deleteDialog.id);

      if (error) throw error;

      // Remove from local state
      setFunnels(prev => prev.filter(f => f.id !== deleteDialog.id));
      setDeleteDialog({ open: false, type: 'funnel', id: '', name: '' });
      toast.success('Funnel deleted successfully');
      
      // Refresh to update totals
      fetchFunnels();
    } catch (error: any) {
      console.error('Error deleting funnel:', error);
      toast.error(error.message || 'Failed to delete funnel');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderSiteCard = (site: WebsiteData | FunnelData, type: 'website' | 'funnel') => {
    const isFunnel = type === 'funnel';
    
    return (
      <div key={site.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{site.name}</h3>
              <Badge variant={site.is_active ? 'default' : 'secondary'}>
                {site.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant={site.is_published ? 'default' : 'outline'}>
                {site.is_published ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">/{site.slug}</p>
            {site.domain && (
              <p className="text-sm text-blue-600 mb-2">{site.domain}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => isFunnel ? toggleFunnelStatus(site.id, !site.is_active) : toggleWebsiteStatus(site.id, !site.is_active)}
            >
              {site.is_active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialog({
                open: true,
                type: type,
                id: site.id,
                name: site.name
              })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Site Name:</span>
            <p className="font-medium">{site.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Site Slug:</span>
            <p className="font-medium">/{site.slug}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Owner Name:</span>
            <p className="font-medium">{site.owner_name || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Owner Email:</span>
            <p className="font-medium">{site.owner_email || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>
            <p className="font-medium">{new Date(site.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Type:</span>
            <p className="font-medium capitalize">{type}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderPagination = (currentPage: number, totalItems: number, onPageChange: (page: number) => void) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalItems} items
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Filter websites and funnels based on search term
  const filteredWebsites = websites.filter(website =>
    website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    website.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (website.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (website.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredFunnels = funnels.filter(funnel =>
    funnel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    funnel.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (funnel.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (funnel.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (adminLoading || isAdmin === null) {
    return (
      <AdminLayout title="Sites Management" description="Manage websites and funnels">
        <div className="space-y-6">
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Sites Management">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to view this page. Only super admins can access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Sites Management" description="Manage websites and funnels">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sites Overview</CardTitle>
            <CardDescription>
              Manage and monitor all websites and funnels across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by site name, slug, owner name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs defaultValue="websites" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="websites" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Websites ({websiteTotal})
                </TabsTrigger>
                <TabsTrigger value="funnels" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Funnels ({funnelTotal})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="websites" className="mt-6">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-48 w-full" />
                    ))}
                  </div>
                ) : websites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Websites Found</h3>
                    <p className="text-sm">
                      No websites have been created yet.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {websites.map((website) => renderSiteCard(website, 'website'))}
                    </div>
                    {renderPagination(websitePage, websiteTotal, setWebsitePage)}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="funnels" className="mt-6">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-48 w-full" />
                    ))}
                  </div>
                ) : funnels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Funnels Found</h3>
                    <p className="text-sm">
                      No funnels have been created yet.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {funnels.map((funnel) => renderSiteCard(funnel, 'funnel'))}
                    </div>
                    {renderPagination(funnelPage, funnelTotal, setFunnelPage)}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <ConfirmationDialog
          open={deleteDialog.open}
          onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: 'website', id: '', name: '' })}
          title={`Delete ${deleteDialog.type === 'website' ? 'Website' : 'Funnel'}`}
          description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone and will remove all associated data including pages, domains, and analytics.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={deleteDialog.type === 'website' ? handleDeleteWebsite : handleDeleteFunnel}
          isLoading={isDeleting}
        />
      </div>
    </AdminLayout>
  );
}