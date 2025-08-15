import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Zap, Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface WebsiteData {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  owner_email?: string;
  store_name?: string;
}

interface FunnelData {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  owner_email?: string;
  store_name?: string;
}

const AdminSites = () => {
  const { isAdmin } = useAdminData();
  const { toast } = useToast();
  const [websites, setWebsites] = useState<WebsiteData[]>([]);
  const [funnels, setFunnels] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch websites with owner info
      const { data: websitesData, error: websitesError } = await supabase
        .from('websites')
        .select(`
          id,
          name,
          slug,
          domain,
          is_active,
          is_published,
          created_at,
          stores!websites_store_id_fkey(
            name,
            profiles!stores_owner_id_fkey(email)
          )
        `)
        .order('created_at', { ascending: false });

      if (websitesError) throw websitesError;

      // Fetch funnels with owner info
      const { data: funnelsData, error: funnelsError } = await supabase
        .from('funnels')
        .select(`
          id,
          name,
          slug,
          domain,
          is_active,
          is_published,
          created_at,
          stores!funnels_store_id_fkey(
            name,
            profiles!stores_owner_id_fkey(email)
          )
        `)
        .order('created_at', { ascending: false });

      if (funnelsError) throw funnelsError;

      // Transform data
      const websitesWithOwner = websitesData?.map(website => ({
        id: website.id,
        name: website.name,
        slug: website.slug,
        domain: website.domain,
        is_active: website.is_active,
        is_published: website.is_published,
        created_at: website.created_at,
        store_name: (website.stores as any)?.name || 'Unknown Store',
        owner_email: (website.stores as any)?.profiles?.email || 'Unknown'
      })) || [];

      const funnelsWithOwner = funnelsData?.map(funnel => ({
        id: funnel.id,
        name: funnel.name,
        slug: funnel.slug,
        domain: funnel.domain,
        is_active: funnel.is_active,
        is_published: funnel.is_published,
        created_at: funnel.created_at,
        store_name: (funnel.stores as any)?.name || 'Unknown Store',
        owner_email: (funnel.stores as any)?.profiles?.email || 'Unknown'
      })) || [];

      setWebsites(websitesWithOwner);
      setFunnels(funnelsWithOwner);
    } catch (err) {
      console.error('Error loading sites:', err);
      toast({
        title: 'Load Failed',
        description: 'Failed to load websites and funnels data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWebsiteStatus = async (websiteId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('websites')
        .update({ is_active: !currentStatus })
        .eq('id', websiteId);

      if (error) throw error;

      setWebsites(prev => prev.map(website =>
        website.id === websiteId 
          ? { ...website, is_active: !currentStatus }
          : website
      ));

      toast({
        title: 'Status Updated',
        description: `Website ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (err) {
      console.error('Error updating website status:', err);
      toast({
        title: 'Update Failed',
        description: 'Failed to update website status.',
        variant: 'destructive',
      });
    }
  };

  const toggleFunnelStatus = async (funnelId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('funnels')
        .update({ is_active: !currentStatus })
        .eq('id', funnelId);

      if (error) throw error;

      setFunnels(prev => prev.map(funnel =>
        funnel.id === funnelId 
          ? { ...funnel, is_active: !currentStatus }
          : funnel
      ));

      toast({
        title: 'Status Updated',
        description: `Funnel ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (err) {
      console.error('Error updating funnel status:', err);
      toast({
        title: 'Update Failed',
        description: 'Failed to update funnel status.',
        variant: 'destructive',
      });
    }
  };

  const filteredWebsites = websites.filter(website =>
    website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    website.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (website.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (website.store_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredFunnels = funnels.filter(funnel =>
    funnel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    funnel.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (funnel.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (funnel.store_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAdmin) {
    return (
      <AdminLayout title="Sites Management">
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

  const renderSiteCard = (site: WebsiteData | FunnelData, type: 'website' | 'funnel') => (
    <div key={site.id} className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h4 className="font-medium">{site.name}</h4>
          <Badge variant={site.is_active ? "default" : "secondary"}>
            {site.is_active ? "Active" : "Inactive"}
          </Badge>
          {site.is_published && (
            <Badge variant="outline">Published</Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          <span>Slug: {site.slug}</span>
          {site.domain && <span className="ml-4">Domain: {site.domain}</span>}
          <span className="ml-4">Store: {site.store_name}</span>
          {site.owner_email && (
            <span className="ml-4">Owner: {site.owner_email}</span>
          )}
          <span className="ml-4">
            Created: {new Date(site.created_at).toLocaleDateString('en-US')}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant={site.is_active ? "destructive" : "default"}
        onClick={() => 
          type === 'website' 
            ? toggleWebsiteStatus(site.id, site.is_active)
            : toggleFunnelStatus(site.id, site.is_active)
        }
      >
        {site.is_active ? (
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
  );

  return (
    <AdminLayout title="Sites Management" description="Manage all websites and funnels across the platform">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                All Sites ({websites.length + funnels.length})
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sites..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                  <div className="text-center py-8">Loading websites...</div>
                ) : filteredWebsites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No websites found matching your search.' : 'No websites found.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredWebsites.map((website) => renderSiteCard(website, 'website'))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="funnels" className="mt-6">
                {loading ? (
                  <div className="text-center py-8">Loading funnels...</div>
                ) : filteredFunnels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No funnels found matching your search.' : 'No funnels found.'}
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
};

export default AdminSites;