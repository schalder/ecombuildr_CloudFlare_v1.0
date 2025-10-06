import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';

interface DomainVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDomainAdded: (domain: string) => void;
  onVerifyDNS: (domain: string) => Promise<any>;
}

export const DomainVerificationDialog: React.FC<DomainVerificationDialogProps> = ({
  open,
  onOpenChange,
  onDomainAdded,
  onVerifyDNS
}) => {
  const [step, setStep] = useState<'enter' | 'setup' | 'verify' | 'success'>('enter');
  const [domain, setDomain] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [vercelCnameTarget, setVercelCnameTarget] = useState<string | null>(null);
  const [isLoadingCname, setIsLoadingCname] = useState(false);
  
  const { store } = useUserStore();

  const fetchVercelCname = async (domainName: string) => {
    if (!store?.id) return;
    
    setIsLoadingCname(true);
    try {
      // First, add the domain to Vercel project
      const { data: addData, error: addError } = await supabase.functions.invoke('dns-domain-manager', {
        body: {
          action: 'add_domain',
          domain: domainName,
          storeId: store.id
        }
      });

      if (addError) throw addError;
      
      if (addData.success) {
        // Always set the CNAME target, whether it's specific or generic
        setVercelCnameTarget(addData.vercelCnameTarget || 'cname.vercel-dns.com');
        console.log(`Domain ${domainName} added with CNAME:`, addData.vercelCnameTarget || 'cname.vercel-dns.com');
      } else {
        setVercelCnameTarget('cname.vercel-dns.com');
      }
    } catch (error) {
      console.error('Failed to add domain to Vercel:', error);
      setVercelCnameTarget('cname.vercel-dns.com');
    } finally {
      setIsLoadingCname(false);
    }
  };

  const handleDomainSubmit = async () => {
    if (!domain.trim()) return;
    
    const cleanDomain = domain.toLowerCase().trim();
    setDomain(cleanDomain);
    setStep('setup');
    
    // Fetch Vercel CNAME target for this domain
    await fetchVercelCname(cleanDomain);
  };

  const copyDNSInstructions = () => {
    const cnameTarget = vercelCnameTarget || 'cname.vercel-dns.com';
    const instructions = `DNS Configuration for ${domain}:

CNAME Record:
Type: CNAME
Name: ${domain.split('.')[0]} (or @ for root domain)
Value: ${cnameTarget}
TTL: 300 (or Auto)

Note: This is the domain-specific CNAME target provided by Vercel. SSL will be automatically issued once DNS is configured.`;
    
    navigator.clipboard.writeText(instructions);
    toast({
      title: "DNS Instructions Copied",
      description: `The Vercel-specific DNS configuration for ${domain} has been copied to your clipboard.`
    });
  };

  const handleVerifyDNS = async () => {
    if (verificationAttempts >= 5) {
      toast({
        title: "Too many attempts",
        description: "Please wait before trying again. DNS changes can take up to 24 hours to propagate.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationAttempts(prev => prev + 1);
      
      const result = await onVerifyDNS(domain);
      setVerificationStatus(result);

      if (result?.status?.dnsConfigured) {
        setStep('success');
        toast({
          title: "DNS Verified!",
          description: "Your domain is correctly configured and ready to be added.",
        });
      } else {
        toast({
          title: "DNS Not Ready",
          description: result?.status?.errorMessage || "DNS record not found. Please check your configuration.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('DNS verification failed:', error);
      toast({
        title: "Verification Failed",
        description: "Unable to verify DNS. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddDomain = async () => {
    try {
      setIsAdding(true);
      await onDomainAdded(domain);
      toast({
        title: "Domain Added Successfully",
        description: `${domain} has been added and is being configured.`,
      });
      handleClose();
    } catch (error) {
      toast({
        title: "Error Adding Domain",
        description: error instanceof Error ? error.message : "Failed to add domain",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setStep('enter');
    setDomain('');
    setVerificationStatus(null);
    setVerificationAttempts(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Custom Domain</DialogTitle>
          <DialogDescription>
            Follow these steps to securely add your custom domain
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'enter' ? 'bg-primary text-primary-foreground' : 
              ['setup', 'verify', 'success'].includes(step) ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <span className="text-sm">Enter Domain</span>
          </div>
          <div className="flex-1 h-px bg-muted mx-2"></div>
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'setup' ? 'bg-primary text-primary-foreground' : 
              ['verify', 'success'].includes(step) ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <span className="text-sm">DNS Setup</span>
          </div>
          <div className="flex-1 h-px bg-muted mx-2"></div>
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'verify' ? 'bg-primary text-primary-foreground' : 
              step === 'success' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
            <span className="text-sm">Verify</span>
          </div>
        </div>

        {/* Step 1: Enter Domain */}
        {step === 'enter' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="domain-input">Domain Name</Label>
              <Input
                id="domain-input"
                placeholder="yourdomain.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDomainSubmit()}
              />
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You'll need to configure DNS settings for your domain. Make sure you have access to your domain's DNS management.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step 2: DNS Setup Instructions */}
        {step === 'setup' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Configure DNS for {domain}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Add this DNS record in your DNS provider (Cloudflare, Namecheap, GoDaddy, etc.):
              </p>
              
              <div className="space-y-4">
                {/* CNAME Record */}
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <h5 className="font-medium text-sm">CNAME Record</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>
                      <div className="font-mono bg-background px-2 py-1 rounded">CNAME</div>
                    </div>
                    <div>
                      <span className="font-medium">TTL:</span>
                      <div className="font-mono bg-background px-2 py-1 rounded">300</div>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Name:</span>
                    <div className="font-mono bg-background px-2 py-1 rounded mt-1">
                      {domain.split('.')[0]} (or @ for root domain)
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Value:</span>
                    <div className="font-mono bg-background px-2 py-1 rounded mt-1">
                      {isLoadingCname ? (
                        <span className="text-muted-foreground">Loading Vercel CNAME...</span>
                      ) : vercelCnameTarget ? (
                        vercelCnameTarget
                      ) : (
                        <span className="text-red-500">Failed to get CNAME target</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>🚀 Vercel Unlimited Domains:</strong> Your domain will be hosted on Vercel with automatic SSL certificates and unlimited scalability.
                </p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={copyDNSInstructions}
                className="mt-3"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy DNS Configuration
              </Button>
            </div>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                DNS changes can take 5-30 minutes to propagate. Vercel will automatically issue SSL certificates once DNS is configured.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step 3: Verification */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Verifying DNS for <strong>{domain}</strong></h4>
              
              {verificationStatus && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {verificationStatus.status?.dnsConfigured ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-700">DNS correctly configured!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-700">DNS not ready yet</span>
                      </>
                    )}
                  </div>
                  
                  {verificationStatus.status?.cnameTarget && (
                    <div className="text-sm text-muted-foreground">
                      Current CNAME target: <code className="bg-muted px-1 py-0.5 rounded">{verificationStatus.status.cnameTarget}</code>
                    </div>
                  )}
                  
                  {!verificationStatus.status?.dnsConfigured && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        {verificationStatus.status?.errorMessage || `DNS must point to Vercel. Please add CNAME record: ${domain} -> ${vercelCnameTarget || 'vercel-dns.com'}`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              
              <div className="text-sm text-muted-foreground mt-2">
                Verification attempts: {verificationAttempts}/5
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium text-green-700">DNS Verified Successfully!</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {domain} is correctly configured and ready to be added to your account.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {step === 'enter' && (
              <Button onClick={handleDomainSubmit} disabled={!domain.trim()}>
                Continue
              </Button>
            )}
            
            {step === 'setup' && (
              <Button onClick={() => setStep('verify')}>
                I've configured DNS
              </Button>
            )}
            
            {step === 'verify' && (
              <Button 
                onClick={handleVerifyDNS} 
                disabled={isVerifying || verificationAttempts >= 5}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Verify DNS
                  </>
                )}
              </Button>
            )}
            
            {step === 'success' && (
              <Button onClick={handleAddDomain} disabled={isAdding}>
                {isAdding ? "Adding Domain..." : "Add Domain"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};