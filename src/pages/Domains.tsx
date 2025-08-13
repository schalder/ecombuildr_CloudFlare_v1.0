import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Globe, Trash2, Link as LinkIcon, Settings, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { useDomainManagement } from '@/hooks/useDomainManagement';
import { toast } from '@/hooks/use-toast';

export default function Domains() {
  const { 
    domains, 
    connections, 
    websites, 
    funnels, 
    loading, 
    addDomain, 
    removeDomain, 
    connectContent, 
    removeConnection, 
    setHomepage,
    verifyDomain,
    retryNetlifySetup
  } = useDomainManagement();

  const [newDomain, setNewDomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    domainId: '',
    contentType: 'website' as 'website' | 'funnel',
    contentId: '',
    path: '/',
    isHomepage: false
  });

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    
    try {
      setIsAddingDomain(true);
      await addDomain(newDomain.trim());
      setNewDomain('');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add domain",
        variant: "destructive"
      });
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleConnectContent = async () => {
    try {
      await connectContent(
        connectionForm.domainId,
        connectionForm.contentType,
        connectionForm.contentId,
        connectionForm.path,
        connectionForm.isHomepage
      );
      setConnectionForm({
        domainId: '',
        contentType: 'website',
        contentId: '',
        path: '/',
        isHomepage: false
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect content",
        variant: "destructive"
      });
    }
  };

  const copyDNSInstructions = (domain: string) => {
    const instructions = `CNAME Record:\nName: ${domain}\nValue: ecombuildr.com`;
    navigator.clipboard.writeText(instructions);
    toast({
      title: "DNS Instructions Copied",
      description: "The DNS configuration has been copied to your clipboard."
    });
  };

  const getStatusBadge = (domain: any) => {
    if (domain.is_verified && domain.ssl_status === 'issued') {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
    if (domain.dns_configured && domain.ssl_status === 'provisioning') {
      return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600">SSL Provisioning</Badge>;
    }
    if (domain.dns_configured) {
      return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600">DNS Configured</Badge>;
    }
    return <Badge variant="outline">Setup Required</Badge>;
  };

  const getContentConnections = (domainId: string) => {
    return connections.filter(conn => conn.domain_id === domainId);
  };

  const getContentName = (contentType: string, contentId: string) => {
    if (contentType === 'website') {
      const website = websites.find(w => w.id === contentId);
      return website?.name || 'Unknown Website';
    } else {
      const funnel = funnels.find(f => f.id === contentId);
      return funnel?.name || 'Unknown Funnel';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Domains" description="Manage your custom domains">
        <div>Loading domains...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Domains" description="Connect custom domains to your websites and funnels">
      <div className="space-y-6">
        {/* Add Domain Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Custom Domain
            </CardTitle>
            <CardDescription>
              Connect your own domain to display your websites and funnels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  placeholder="yourdomain.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAddDomain}
                  disabled={isAddingDomain || !newDomain.trim()}
                >
                  {isAddingDomain ? "Adding..." : "Add Domain"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domains List */}
        <div className="space-y-4">
          {domains.map((domain) => (
            <Card key={domain.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">{domain.domain}</CardTitle>
                      <CardDescription>
                        Added {new Date(domain.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(domain)}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Domain</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {domain.domain}? This will disconnect all associated content.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeDomain(domain.id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="setup" className="w-full">
                  <TabsList>
                    <TabsTrigger value="setup">DNS Setup</TabsTrigger>
                    <TabsTrigger value="content">Content ({getContentConnections(domain.id).length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="setup" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">DNS Configuration</h4>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verifyDomain(domain.id)}
                            className="text-xs"
                          >
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Verify Domain
                          </Button>
                          {!domain.is_verified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryNetlifySetup(domain.id)}
                              className="text-xs"
                            >
                              <RefreshCw className="mr-2 h-3 w-3" />
                              Retry Netlify Setup
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Add this CNAME record in your DNS provider (Cloudflare, etc.):
                      </p>
                      
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="space-y-2 font-mono text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span>CNAME</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span>@ (or {domain.domain})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Target:</span>
                            <span>ecombuildr.com</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">TTL:</span>
                            <span>Auto (or 3600)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyDNSInstructions(domain.domain)}
                          className="text-xs"
                        >
                          <Copy className="mr-2 h-3 w-3" />
                          Copy Instructions
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('https://dash.cloudflare.com', '_blank')}
                          className="text-xs"
                        >
                          <ExternalLink className="mr-2 h-3 w-3" />
                          Open Cloudflare
                        </Button>
                      </div>

                      {domain.ssl_status && (
                        <div className="text-xs text-muted-foreground">
                          SSL Status: {domain.ssl_status === 'issued' ? '✅ Active' : 
                                     domain.ssl_status === 'provisioning' ? '⏳ Setting up...' : 
                                     '❌ Pending'}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="content" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Connected Content</h4>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setConnectionForm({ ...connectionForm, domainId: domain.id })}
                          >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Connect Content
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Connect Content to {domain.domain}</DialogTitle>
                            <DialogDescription>
                              Choose what content to display on this domain
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Content Type</Label>
                              <Select
                                value={connectionForm.contentType}
                                onValueChange={(value: 'website' | 'funnel') => 
                                  setConnectionForm({ ...connectionForm, contentType: value, contentId: '' })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="website">Website</SelectItem>
                                  <SelectItem value="funnel">Funnel</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Content</Label>
                              <Select
                                value={connectionForm.contentId}
                                onValueChange={(value) => 
                                  setConnectionForm({ ...connectionForm, contentId: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select content" />
                                </SelectTrigger>
                                <SelectContent>
                                  {connectionForm.contentType === 'website' 
                                    ? websites.map((website) => (
                                        <SelectItem key={website.id} value={website.id}>
                                          {website.name}
                                        </SelectItem>
                                      ))
                                    : funnels.map((funnel) => (
                                        <SelectItem key={funnel.id} value={funnel.id}>
                                          {funnel.name}
                                        </SelectItem>
                                      ))
                                  }
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Path</Label>
                              <Input
                                value={connectionForm.path}
                                onChange={(e) => 
                                  setConnectionForm({ ...connectionForm, path: e.target.value })
                                }
                                placeholder="/"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleConnectContent}>
                              Connect Content
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="space-y-2">
                      {getContentConnections(domain.id).map((connection) => (
                        <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">
                              {getContentName(connection.content_type, connection.content_id)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {connection.path} • {connection.content_type}
                              {connection.is_homepage && <Badge variant="secondary" className="ml-2">Homepage</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!connection.is_homepage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setHomepage(connection.id, domain.id)}
                              >
                                Set as Homepage
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeConnection(connection.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {getContentConnections(domain.id).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No content connected to this domain yet
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
          
          {domains.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No domains added yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first custom domain to start displaying your content on your own URL
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}