import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DomainVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: string;
  onDomainChange: (domain: string) => void;
  onVerifyDNS: (domain: string) => Promise<{ success: boolean; dnsConfigured: boolean; errorMessage?: string }>;
  onAddDomain: (domain: string) => Promise<void>;
  isVerifying: boolean;
  isAdding: boolean;
}

export const DomainVerificationDialog: React.FC<DomainVerificationDialogProps> = ({
  open,
  onOpenChange,
  domain,
  onDomainChange,
  onVerifyDNS,
  onAddDomain,
  isVerifying,
  isAdding
}) => {
  const [step, setStep] = useState<'input' | 'verify' | 'verified'>('input');
  const [dnsInstructions, setDnsInstructions] = useState({
    type: 'CNAME',
    name: '',
    value: 'ecombuildr.com',
    description: ''
  });
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDomainSubmit = () => {
    if (!domain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive",
      });
      return;
    }

    setDnsInstructions({
      type: 'CNAME',
      name: domain.trim(),
      value: 'ecombuildr.com',
      description: `Add a CNAME record for ${domain.trim()} that points to ecombuildr.com`
    });
    setStep('verify');
    setVerificationError(null);
  };

  const handleVerifyDNS = async () => {
    try {
      const result = await onVerifyDNS(domain.trim());
      
      if (result.success && result.dnsConfigured) {
        setStep('verified');
        setVerificationError(null);
        toast({
          title: "DNS Verified",
          description: "Your domain DNS is configured correctly!",
        });
      } else {
        setVerificationError(result.errorMessage || 'DNS verification failed');
      }
    } catch (error) {
      setVerificationError('Failed to verify DNS. Please try again.');
    }
  };

  const handleAddDomain = async () => {
    try {
      await onAddDomain(domain.trim());
      onOpenChange(false);
      resetDialog();
      toast({
        title: "Domain Added",
        description: `${domain} has been added successfully!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add domain. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetDialog = () => {
    setStep('input');
    setVerificationError(null);
    onDomainChange('');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "DNS record copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetDialog();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Domain</DialogTitle>
          <DialogDescription>
            {step === 'input' && 'Enter your domain name to get started'}
            {step === 'verify' && 'Configure your DNS settings and verify'}
            {step === 'verified' && 'DNS verified! Ready to add domain'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'input' && (
            <div className="space-y-3">
              <Label htmlFor="domain">Domain Name</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={domain}
                onChange={(e) => onDomainChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDomainSubmit()}
              />
              <p className="text-sm text-muted-foreground">
                Enter the domain you want to connect to your store
              </p>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Add this DNS record to your domain provider:
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <Label className="font-medium">Type</Label>
                    <p className="font-mono">{dnsInstructions.type}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Name</Label>
                    <p className="font-mono break-all">{dnsInstructions.name}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Value</Label>
                    <div className="flex items-center gap-2">
                      <p className="font-mono">{dnsInstructions.value}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(dnsInstructions.value)}
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                DNS changes may take up to 48 hours to propagate globally.
              </p>

              {verificationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{verificationError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {step === 'verified' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                DNS verification successful! Your domain is ready to be added.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleDomainSubmit}>
                Next
              </Button>
            </>
          )}

          {step === 'verify' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button 
                onClick={handleVerifyDNS}
                disabled={isVerifying}
              >
                {isVerifying && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Verify DNS Setup
              </Button>
            </>
          )}

          {step === 'verified' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddDomain}
                disabled={isAdding}
              >
                {isAdding && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Add Domain
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};