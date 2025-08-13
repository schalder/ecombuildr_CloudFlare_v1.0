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
import { DomainVerificationDialog } from '@/components/domain/DomainVerificationDialog';
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
    verifyDomainDNS,
    checkSSL
  } = useDomainManagement();

  const [newDomain, setNewDomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [isVerifyingDNS, setIsVerifyingDNS] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    domainId: '',
    contentType: 'website' as 'website' | 'funnel',
    contentId: '',
    path: '/',
    isHomepage: false
  });

  const handleVerifyDNS = async (domain: string) => {
    try {
      setIsVerifyingDNS(true);
      return await verifyDomainDNS(domain);
    } finally {
      setIsVerifyingDNS(false);
    }
  };

  const handleAddDomain = async (domain: string) => {
    try {
      setIsAddingDomain(true);
      await addDomain(domain);
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
              Add New Domain
            </CardTitle>
            <CardDescription>
              Connect your custom domain to this store with DNS verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setShowVerificationDialog(true)}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Domain
            </Button>
            <p className="text-sm text-muted-foreground">
              We'll verify your DNS configuration before adding the domain
            </p>
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
                        {domain.dns_verified_at && (
                          <span className="ml-2">• DNS verified {new Date(domain.dns_verified_at).toLocaleDateString()}</span>
                        )}
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
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Domain Status</h4>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verifyDomain(domain.id)}
                            className="text-xs"
                          >
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Check Status
                          </Button>
                        </div>
                      </div>

                      {/* DNS Status Display */}
                      <div className="bg-card border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">DNS Configuration:</span>
                            <span className={domain.dns_configured ? 'text-green-600' : 'text-amber-600'}>
                              {domain.dns_configured ? '✅ Configured' : '⏳ Pending'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">SSL Status:</span>
                            <span className={domain.ssl_status === 'issued' ? 'text-green-600' : 'text-amber-600'}>
                              {domain.ssl_status === 'issued' ? '✅ Active' : '⏳ ' + domain.ssl_status}
                            </span>
                          </div>
                          
                          {domain.is_verified ? (
                            <div className="text-sm text-green-700">
                              Your domain is live and ready to use! 🎉
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {domain.dns_configured 
                                ? 'DNS configured. SSL certificate is being provisioned...' 
                                : 'Please configure DNS settings to activate this domain.'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* DNS Setup Instructions */}
                      {!domain.dns_configured && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                          <h5 className="font-semibold text-amber-800 mb-2">DNS Setup Required</h5>
                          <p className="text-sm text-amber-700 mb-3">
                            Add this CNAME record in your DNS provider:
                          </p>
                          
                          <div className="bg-white border p-3 rounded-lg">
                            <div className="space-y-2 font-mono text-xs">
                              <div className="grid grid-cols-3 gap-4">
                                <span className="text-muted-foreground font-normal">Type:</span>
                                <span className="font-semibold">CNAME</span>
                                <span></span>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <span className="text-muted-foreground font-normal">Name:</span>
                                <span className="font-semibold">{domain.domain}</span>
                                <span></span>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <span className="text-muted-foreground font-normal">Target:</span>
                                <span className="font-semibold">ecombuildr.com</span>
                                <span></span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyDNSInstructions(domain.domain)}
                              className="text-xs"
                            >
                              <Copy className="mr-2 h-3 w-3" />
                              Copy DNS Config
                            </Button>
                          </div>
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

        <DomainVerificationDialog
          open={showVerificationDialog}
          onOpenChange={setShowVerificationDialog}
          domain={newDomain}
          onDomainChange={setNewDomain}
          onVerifyDNS={handleVerifyDNS}
          onAddDomain={handleAddDomain}
          isVerifying={isVerifyingDNS}
          isAdding={isAddingDomain}
        />
      </div>
    </DashboardLayout>
  );
}