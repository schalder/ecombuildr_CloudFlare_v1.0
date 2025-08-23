import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { useWhatsAppNotifications } from '@/hooks/useWhatsAppNotifications';
import { useToast } from '@/hooks/use-toast';

export const WhatsAppSettings = () => {
  const { 
    whatsappAccount, 
    setupWhatsAppAccount, 
    updateWhatsAppAccount, 
    testWhatsAppMessage, 
    loading 
  } = useWhatsAppNotifications();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    phone_number: '',
    phone_number_id: '',
    business_account_id: '',
    access_token: '',
    webhook_verify_token: '',
    is_active: true
  });

  useEffect(() => {
    if (whatsappAccount) {
      setFormData({
        phone_number: whatsappAccount.phone_number || '',
        phone_number_id: whatsappAccount.phone_number_id || '',
        business_account_id: whatsappAccount.business_account_id || '',
        access_token: whatsappAccount.access_token || '',
        webhook_verify_token: whatsappAccount.webhook_verify_token || '',
        is_active: whatsappAccount.is_active || true
      });
    }
  }, [whatsappAccount]);

  const handleSave = async () => {
    try {
      if (whatsappAccount) {
        await updateWhatsAppAccount(formData);
        toast({ title: "WhatsApp settings updated successfully" });
      } else {
        await setupWhatsAppAccount(formData);
        toast({ title: "WhatsApp account configured successfully" });
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save WhatsApp settings",
        variant: "destructive" 
      });
    }
  };

  const handleTest = async () => {
    try {
      await testWhatsAppMessage("Test message from your store notifications system! 🎉");
      toast({ title: "Test message sent successfully" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to send test message",
        variant: "destructive" 
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          WhatsApp Business Integration
        </CardTitle>
        <CardDescription>
          Configure WhatsApp Business API to send notifications about orders and updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Enable WhatsApp Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Send automated notifications via WhatsApp
            </p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, is_active: checked }))
            }
          />
        </div>

        {formData.is_active && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  placeholder="+1234567890"
                  value={formData.phone_number}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, phone_number: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number_id">Phone Number ID</Label>
                <Input
                  id="phone_number_id"
                  placeholder="WhatsApp Phone Number ID"
                  value={formData.phone_number_id}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, phone_number_id: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_account_id">Business Account ID</Label>
              <Input
                id="business_account_id"
                placeholder="WhatsApp Business Account ID"
                value={formData.business_account_id}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, business_account_id: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token</Label>
              <Input
                id="access_token"
                type="password"
                placeholder="WhatsApp API Access Token"
                value={formData.access_token}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, access_token: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_verify_token">Webhook Verify Token</Label>
              <Input
                id="webhook_verify_token"
                placeholder="Webhook verification token"
                value={formData.webhook_verify_token}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, webhook_verify_token: e.target.value }))
                }
              />
            </div>

            {whatsappAccount && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                {whatsappAccount.is_verified ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700">Account verified and active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-700">Account not verified</span>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="flex-1"
              >
                {whatsappAccount ? 'Update Settings' : 'Save Configuration'}
              </Button>
              {whatsappAccount && (
                <Button 
                  variant="outline" 
                  onClick={handleTest}
                  disabled={loading || !whatsappAccount.is_verified}
                >
                  Send Test
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};