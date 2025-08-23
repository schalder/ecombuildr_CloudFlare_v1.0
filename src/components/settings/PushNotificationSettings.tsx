
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Smartphone, AlertCircle, Send } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const PushNotificationSettings: React.FC = () => {
  const {
    isSupported,
    permission,
    subscription,
    loading,
    subscribe,
    unsubscribe,
    isSubscribed,
    sendTestNotification,
  } = usePushNotifications();

  const [testLoading, setTestLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<string | null>(null);

  const handleSendTest = async () => {
    setTestLoading(true);
    setLastTestResult(null);
    try {
      await sendTestNotification();
      setLastTestResult('success');
    } catch (error) {
      console.error('Test notification failed:', error);
      setLastTestResult('error');
    } finally {
      setTestLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  // Handle unsupported browsers, especially iOS Safari
  if (!isSupported) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Push Notifications</CardTitle>
            <Badge variant="outline">Not Available</Badge>
          </div>
          <CardDescription>
            Get instant notifications for new orders and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              {isIOS && !isInStandaloneMode ? (
                <div className="space-y-3">
                  <p className="font-semibold">Install this app to enable push notifications:</p>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border border-orange-200 dark:border-orange-700">
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">1</span>
                        Tap the Share button <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs font-mono ml-1">□↑</span> at the bottom of Safari
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">2</span>
                        Scroll down and select <span className="font-semibold">"Add to Home Screen"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">3</span>
                        Tap <span className="font-semibold">"Add"</span> to install the app
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-300">4</span>
                        Open the app from your Home Screen (not Safari)
                      </li>
                    </ol>
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    ⚠️ Notifications only work when using the installed app, not in Safari browser.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold mb-2">Push notifications are not supported in this browser.</p>
                  <p>Please use a modern browser like:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Google Chrome</li>
                    <li>Mozilla Firefox</li>
                    <li>Microsoft Edge</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
          {isSubscribed && <Badge variant="secondary">Active</Badge>}
        </CardTitle>
        <CardDescription>
          Get instant mobile notifications when you receive new orders on any of your stores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-notifications" className="text-base">
              Enable Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications for new orders, payments, and important updates
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>

        {permission === 'denied' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are blocked. Please enable them in your browser settings and refresh the page.
            </AlertDescription>
          </Alert>
        )}

        {isSubscribed && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSendTest}
                disabled={loading || testLoading}
              >
                <Send className="h-4 w-4 mr-2" />
                {testLoading ? 'Sending...' : 'Send Test'}
              </Button>
              {lastTestResult === 'success' && (
                <span className="text-sm text-green-600 dark:text-green-400">✓ Test sent successfully</span>
              )}
              {lastTestResult === 'error' && (
                <span className="text-sm text-red-600 dark:text-red-400">✗ Test failed to send</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              You'll receive notifications on this device when new orders come in
            </p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">What you'll be notified about:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• New orders from customers</li>
            <li>• Successful payment confirmations</li>
            <li>• Low stock alerts</li>
            <li>• Important account updates</li>
          </ul>
        </div>

        {!isSubscribed && permission === 'default' && (
          <Button 
            onClick={() => handleToggle(true)} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Setting up...' : 'Enable Push Notifications'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
