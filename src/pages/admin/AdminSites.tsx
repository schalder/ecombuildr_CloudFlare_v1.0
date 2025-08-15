import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Zap, Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

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

  useEffect(() => {
    if (isAdmin) {
      fetchWebsites();
      fetchFunnels();
    }
  }, [isAdmin]);

  const fetchWebsites = async () => {
    try {
      const { data, error } = await supabase
        .from('websites')
        .select(`
          id,
          name,
          slug,
          domain,
          is_active,
          is_published,
          created_at,
          stores!inner(
            name,
            owner_id,
            profiles!inner(email, full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedWebsites = data?.map(site => ({
        id: site.id,
        name: site.name,
        slug: site.slug,
        domain: site.domain,
        is_active: site.is_active,
        is_published: site.is_published,
        created_at: site.created_at,
        owner_email: site.stores?.profiles?.email,
        owner_name: site.stores?.profiles?.full_name,
        store_name: site.stores?.name
      })) || [];

      setWebsites(formattedWebsites);
    } catch (error) {
      console.error('Error fetching websites:', error);
    }
  };

  const fetchFunnels = async () => {
    try {
      // First get unique funnel IDs from funnel_steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('funnel_steps')
        .select(`
          funnel_id,
          title,
          slug,
          is_published,
          created_at,
          funnels!inner(
            id,
            name,
            slug,
            is_active,
            is_published,
            created_at,
            stores!inner(
              name,
              owner_id,
              profiles!inner(email, full_name)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (stepsError) throw stepsError;

      // Group by funnel_id to get unique funnels
      const funnelMap = new Map();
      stepsData?.forEach(step => {
        const funnelId = step.funnel_id;
        if (!funnelMap.has(funnelId)) {
          funnelMap.set(funnelId, {
            id: funnelId,
            name: step.funnels?.name || step.title,
            slug: step.funnels?.slug || step.slug,
            domain: null,
            is_active: step.funnels?.is_active ?? true,
            is_published: step.funnels?.is_published ?? step.is_published,
            created_at: step.funnels?.created_at || step.created_at,
            owner_email: step.funnels?.stores?.profiles?.email,
            owner_name: step.funnels?.stores?.profiles?.full_name,
            store_name: step.funnels?.stores?.name
          });
        }
      });

      const formattedFunnels = Array.from(funnelMap.values());
      setFunnels(formattedFunnels);
    } catch (error) {
      console.error('Error fetching funnels:', error);
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
                  Websites ({filteredWebsites.length})
                </TabsTrigger>
                <TabsTrigger value="funnels" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Funnels ({filteredFunnels.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="websites" className="mt-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : filteredWebsites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Websites Found</h3>
                    <p className="text-sm">
                      {searchTerm ? 'No websites match your search criteria.' : 'No websites have been created yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredWebsites.map((website) => renderSiteCard(website, 'website'))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="funnels" className="mt-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : filteredFunnels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Funnels Found</h3>
                    <p className="text-sm">
                      {searchTerm ? 'No funnels match your search criteria.' : 'No funnels have been created yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFunnels.map((funnel) => renderSiteCard(funnel, 'funnel'))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}