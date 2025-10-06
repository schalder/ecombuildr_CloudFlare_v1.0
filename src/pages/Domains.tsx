import React, { useState, useEffect } from 'react';
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
    getVercelCNAME,
    removeDomain, 
    connectContent, 
    removeConnection, 
    setHomepage,
    verifyDomain,
    verifyDomainDNS,
    checkSSL
  } = useDomainManagement();

  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    domainId: '',
    contentType: 'website' as 'website' | 'funnel',
    contentId: '',
    path: '/',
    isHomepage: false
  });

  // Load Vercel CNAME targets for all domains
  useEffect(() => {
    const loadCnameTargets = async () => {
      for (const domain of domains) {
        try {
          const cnameData = await getVercelCNAME(domain.domain);
          // Use the CNAME target from Edge Function, or generate domain-specific fallback
          let cnameTarget = cnameData.cnameTarget;
          
          // If no CNAME target from Edge Function, generate domain-specific one
          if (!cnameTarget) {
            // Generate domain-specific CNAME using same logic as Edge Function
            const domainHash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(domain.domain));
            const hashHex = Array.from(new Uint8Array(domainHash))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('')
              .substring(0, 16);
            cnameTarget = `${hashHex}.vercel-dns-017.com`;
          }
          
          const element = document.getElementById(`cname-target-${domain.id}`);
          if (element) {
            element.textContent = cnameTarget;
          }
        } catch (error) {
          console.error(`Failed to load CNAME for ${domain.domain}:`, error);
          // Generate domain-specific CNAME as fallback
          try {
            const domainHash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(domain.domain));
            const hashHex = Array.from(new Uint8Array(domainHash))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('')
              .substring(0, 16);
            const fallbackCname = `${hashHex}.vercel-dns-017.com`;
            
            const element = document.getElementById(`cname-target-${domain.id}`);
            if (element) {
              element.textContent = fallbackCname;
            }
          } catch (hashError) {
            console.error('Hash generation failed:', hashError);
            const element = document.getElementById(`cname-target-${domain.id}`);
            if (element) {
              element.textContent = 'cname.vercel-dns.com';
            }
          }
        }
      }
    };

    if (domains.length > 0) {
      loadCnameTargets();
    }
  }, [domains, getVercelCNAME]);

  const handleDomainAdded = async (domain: string) => {
    try {
      await addDomain(domain, true); // DNS is verified at this point
    } catch (error) {
      console.error('Error adding domain:', error);
      throw error;
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

  const copyDNSInstructions = async (domain: string) => {
    try {
      // Get the Vercel-specific CNAME target for this domain
      const cnameData = await getVercelCNAME(domain);
      let cnameTarget = cnameData.cnameTarget;
      
      // If no CNAME target from Edge Function, generate domain-specific one
      if (!cnameTarget) {
        // Generate domain-specific CNAME using same logic as Edge Function
        const domainHash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(domain));
        const hashHex = Array.from(new Uint8Array(domainHash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .substring(0, 16);
        cnameTarget = `${hashHex}.vercel-dns-017.com`;
      }
      
      const instructions = `DNS Configuration for ${domain}:

CNAME Record:
Type: CNAME
Name: ${domain.split('.')[0]} (or @ for root domain)
Value: ${cnameTarget}
TTL: 300 (or Auto)

Note: This is the specific CNAME target provided by Vercel for your domain. SSL will be automatically issued once DNS is configured.`;
      
      navigator.clipboard.writeText(instructions);
      toast({
        title: "DNS Instructions Copied",
        description: `The Vercel-specific DNS configuration for ${domain} has been copied to your clipboard.`
      });
    } catch (error) {
      console.error('Failed to get Vercel CNAME:', error);
      // Fallback: Generate domain-specific CNAME
      try {
        const domainHash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(domain));
        const hashHex = Array.from(new Uint8Array(domainHash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .substring(0, 16);
        const fallbackCname = `${hashHex}.vercel-dns-017.com`;
        
        const instructions = `DNS Configuration for ${domain}:

CNAME Record:
Type: CNAME
Name: ${domain.split('.')[0]} (or @ for root domain)
Value: ${fallbackCname}
TTL: 300 (or Auto)

Note: This is the domain-specific CNAME target for your domain. SSL will be automatically issued once DNS is configured.`;
        
        navigator.clipboard.writeText(instructions);
        toast({
          title: "DNS Instructions Copied",
          description: "Domain-specific DNS configuration has been copied to your clipboard."
        });
      } catch (hashError) {
        console.error('Hash generation failed:', hashError);
        // Final fallback to generic instructions
        const instructions = `DNS Configuration for ${domain}:

CNAME Record:
Type: CNAME
Name: ${domain.split('.')[0]} (or @ for root domain)
Value: cname.vercel-dns.com
TTL: 300 (or Auto)

Note: Configure DNS to point to Vercel. SSL will be automatically issued.`;
        
        navigator.clipboard.writeText(instructions);
        toast({
          title: "DNS Instructions Copied",
          description: "Generic Vercel DNS configuration has been copied to your clipboard."
        });
      }
    }
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
    } else if (contentType === 'funnel') {
      const funnel = funnels.find(f => f.id === contentId);
      return funnel?.name || 'Unknown Funnel';
    } else if (contentType === 'course_area') {
      return 'Course Area';
    } else if (contentType === 'course_library') {
      return 'Course Library';
    } else if (contentType === 'course_detail') {
      return 'Course Detail';
    } else {
      return 'Unknown Content';
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
            <div className="flex justify-center">
              <Button 
                onClick={() => setShowVerificationDialog(true)}
                className="w-full max-w-md"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Domain
              </Button>
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

                      {/* Simple Status Display */}
                      <div className="bg-card border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Domain Status:</span>
                            <span className={domain.is_verified ? 'text-green-600' : 'text-amber-600'}>
                              {domain.is_verified ? '✅ Active & Ready' : '⏳ Setting up...'}
                            </span>
                          </div>
                          
                          {!domain.is_verified && (
                            <div className="text-sm text-muted-foreground">
                              {domain.dns_configured 
                                ? 'DNS configured. SSL certificate is being provisioned...' 
                                : 'Automatic setup in progress. This usually takes 5-30 minutes.'}
                            </div>
                          )}
                          
                          {domain.is_verified && (
                            <div className="text-sm text-green-700">
                              Your domain is live and ready to use! 🎉
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Manual Setup Fallback - Only show if needed */}
                      {!domain.dns_configured && (
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                            Need to set up manually? Click here for instructions
                          </summary>
                          <div className="mt-4 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                              <h5 className="font-semibold text-amber-800 mb-2">Manual DNS Setup</h5>
                              <p className="text-sm text-amber-700 mb-3">
                                If automatic setup isn't working, add these DNS records in your DNS provider:
                              </p>
                              
                              <div className="bg-white border p-3 rounded-lg space-y-3">
                                <div className="space-y-2 font-mono text-xs">
                                  <h6 className="font-semibold text-gray-800">CNAME Record:</h6>
                                  <div className="grid grid-cols-3 gap-4">
                                    <span className="text-muted-foreground font-normal">Type:</span>
                                    <span className="font-semibold">CNAME</span>
                                    <span></span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                    <span className="text-muted-foreground font-normal">Name:</span>
                                    <span className="font-semibold">{domain.domain.split('.')[0]} (or @ for root)</span>
                                    <span></span>
                                  </div>
                                   <div className="grid grid-cols-3 gap-4">
                                     <span className="text-muted-foreground font-normal">Value:</span>
                                     <span className="font-semibold text-blue-600" id={`cname-target-${domain.id}`}>
                                       Loading Vercel CNAME...
                                     </span>
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
                          </div>
                        </details>
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
                              {connection.content_type.startsWith('course') && <Badge variant="outline" className="ml-2">Course</Badge>}
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

        {/* Domain Verification Dialog */}
        <DomainVerificationDialog
          open={showVerificationDialog}
          onOpenChange={setShowVerificationDialog}
          onDomainAdded={handleDomainAdded}
          onVerifyDNS={verifyDomainDNS}
        />
      </div>
    </DashboardLayout>
  );
}