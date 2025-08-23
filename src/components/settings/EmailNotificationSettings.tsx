
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useToast } from '@/hooks/use-toast';
import { Mail, Bell, DollarSign, AlertTriangle, X } from 'lucide-react';

interface EmailNotificationSettingsProps {
  storeId: string;
}

export function EmailNotificationSettings({ storeId }: EmailNotificationSettingsProps) {
  const { settings, loading, updateSettings, sendTestEmail: sendTestEmailFn } = useEmailNotifications(storeId);
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [useDebugMode, setUseDebugMode] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleSettingChange = async (key: keyof typeof settings, value: boolean) => {
    const result = await updateSettings({ [key]: value });
    
    if (result?.success) {
      toast({
        title: "Settings Updated",
        description: "Email notification settings have been saved.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to send a test notification.",
        variant: "destructive",
      });
      return;
    }

    setSendingTest(true);
    setLastError(null);
    try {
      await sendTestEmailFn(testEmail, useDebugMode);
      
      toast({
        title: "Test Email Sent",
        description: `Test notification sent to ${testEmail}`,
      });
      setTestEmail(''); // Clear the input after successful send
    } catch (error: any) {
      console.error('Test email error:', error);
      const errorMessage = error?.message || "Failed to send test email";
      setLastError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const notificationTypes = [
    {
      key: 'new_orders' as const,
      title: 'New Orders',
      description: 'Get notified when a new order is placed on your website',
      icon: Mail,
    },
    {
      key: 'payment_received' as const,
      title: 'Payment Received',
      description: 'Get notified when payment is confirmed for an order',
      icon: DollarSign,
    },
    {
      key: 'low_stock' as const,
      title: 'Low Stock Alerts',
      description: 'Get notified when product inventory is running low',
      icon: AlertTriangle,
    },
    {
      key: 'order_cancelled' as const,
      title: 'Order Cancellations',
      description: 'Get notified when an order is cancelled',
      icon: X,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure when you want to receive email notifications for your website orders and events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {notificationTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <Label htmlFor={type.key} className="text-sm font-medium cursor-pointer">
                        {type.title}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={type.key}
                    checked={settings[type.key]}
                    onCheckedChange={(checked) => handleSettingChange(type.key, checked)}
                    disabled={loading}
                  />
                </div>
              );
            })}
          </div>

          <div className="border-t pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-email" className="text-sm font-medium">
                  Test Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Send a test notification to verify your email settings are working correctly.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="Enter email address..."
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendTestEmail} 
                    disabled={sendingTest || !testEmail}
                    variant="outline"
                  >
                    {sendingTest ? "Sending..." : "Send Test"}
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="debug-mode"
                    checked={useDebugMode}
                    onCheckedChange={(checked) => setUseDebugMode(checked as boolean)}
                  />
                  <Label htmlFor="debug-mode" className="text-sm text-muted-foreground">
                    Use debug mode (sends from verified Resend domain)
                  </Label>
                </div>
                
                {lastError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive font-medium">Error Details:</p>
                    <p className="text-xs text-destructive/80 mt-1">{lastError}</p>
                    {!useDebugMode && (
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Try enabling debug mode or verify your domain at{" "}
                        <a 
                          href="https://resend.com/domains" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          resend.com/domains
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
