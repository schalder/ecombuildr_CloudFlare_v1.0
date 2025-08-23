import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Bell, BellOff, Smartphone, Check, X, Heart, Zap, Settings, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";

export const PushNotificationSettings = () => {
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    loading, 
    diagnostics,
    subscribe, 
    unsubscribe, 
    sendTestNotification,
    checkServerHealth
  } = usePushNotifications();
  
  const { toast } = useToast();
  const [testLoading, setTestLoading] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleSubscribe = async () => {
    try {
      await subscribe();
    } catch (error: any) {
      toast({
        title: "Failed to enable notifications",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribe();
    } catch (error: any) {
      toast({
        title: "Failed to disable notifications", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSendTest = async () => {
    setTestLoading(true);
    try {
      await sendTestNotification();
      toast({
        title: "Test notification sent",
        description: "Check your device for the notification"
      });
    } catch (error: any) {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Enhanced iOS handling
  const renderIOSGuidance = () => {
    if (!diagnostics?.isIOSWithoutPWA) return null;
    
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          <strong>iOS Setup Required:</strong> To receive push notifications on iOS, you must install this app to your Home Screen first.
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span>Tap the Share button <ExternalLink className="inline h-3 w-3" /> in Safari</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span>Select "Add to Home Screen"</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span>Open the app from your Home Screen and return here</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  // If notifications are not supported
  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive instant notifications about orders and important updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderIOSGuidance()}
          
          {!diagnostics?.isIOSWithoutPWA && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Push notifications are not supported on this browser or device.
                Try using a modern browser like Chrome, Firefox, or Safari.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Check if permission is denied for better type safety
  const isPermissionDenied = permission === 'denied';

  // Permission denied - show help
  if (isPermissionDenied) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
            <Badge variant="destructive">Blocked</Badge>
          </CardTitle>
          <CardDescription>
            Receive instant notifications about orders and important updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Notifications are blocked.</strong> To enable them:
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Set "Notifications" to "Allow"</li>
                <li>Refresh this page</li>
              </ol>
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
          {isSubscribed && <Badge variant="default">Enabled</Badge>}
        </CardTitle>
        <CardDescription>
          Receive instant notifications about orders and important updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {renderIOSGuidance()}
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="font-medium">Notifications Status</span>
                <Badge variant={isSubscribed ? "default" : "secondary"}>
                  {isSubscribed ? "Enabled" : "Disabled"}
                </Badge>
                {diagnostics?.isIOSPWA && (
                  <Badge variant="outline" className="text-xs">
                    iOS PWA
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isSubscribed 
                  ? "You'll receive notifications about orders and updates"
                  : isPermissionDenied
                  ? "Notifications are blocked. Please enable them in your browser settings."
                  : diagnostics?.isIOSWithoutPWA
                  ? "Install the app to your Home Screen first to enable notifications"
                  : "Enable to receive important notifications"
                }
              </p>
            </div>
            
            <div className="flex gap-2">
              {isSubscribed ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSendTest}
                    disabled={testLoading}
                    size="sm"
                  >
                    {testLoading ? "Sending..." : "Send Test"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleUnsubscribe}
                    disabled={loading}
                    size="sm"
                  >
                    <BellOff className="h-4 w-4 mr-1" />
                    Disable
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleSubscribe}
                  disabled={loading || isPermissionDenied || diagnostics?.isIOSWithoutPWA}
                  size="sm"
                >
                  <Bell className="h-4 w-4 mr-1" />
                  {loading ? "Enabling..." : "Enable Notifications"}
                </Button>
              )}
            </div>
          </div>

          {/* Diagnostics Section */}
          <Separator />
          
          <Collapsible open={showDiagnostics} onOpenChange={setShowDiagnostics}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Diagnostics & Troubleshooting</span>
                </div>
                <Zap className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">Browser Support</h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Service Worker</span>
                      {diagnostics?.serviceWorkerRegistered ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Push API</span>
                      {diagnostics?.isSupported ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Permission</span>
                      <Badge variant={permission === 'granted' ? 'default' : isPermissionDenied ? 'destructive' : 'secondary'}>
                        {permission}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Server Status</h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>VAPID Keys</span>
                      {diagnostics?.serverHealth?.checks.vapidKeysConfigured ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Crypto Valid</span>
                      {diagnostics?.serverHealth?.checks.vapidCryptoValid ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Service Health</span>
                      <Badge variant={diagnostics?.serverHealth?.status === 'healthy' ? 'default' : 'destructive'}>
                        {diagnostics?.serverHealth?.status || 'unknown'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {diagnostics?.lastTestResult && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Last Test Result</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {diagnostics.lastTestResult}
                  </p>
                </div>
              )}
              
              {diagnostics?.serverHealth?.recommendations && diagnostics.serverHealth.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Recommendations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {diagnostics.serverHealth.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 mt-0.5 text-orange-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkServerHealth}
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Refresh Health Check
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};