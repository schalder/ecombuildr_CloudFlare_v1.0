
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Smartphone, AlertCircle } from 'lucide-react';
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
  } = usePushNotifications();

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get instant mobile notifications when you receive new orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
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
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Connected</span>
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
