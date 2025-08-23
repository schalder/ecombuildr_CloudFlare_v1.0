import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageCircle, Mail, AlertTriangle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPreferences {
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  new_order_notifications: boolean;
  low_stock_notifications: boolean;
  payment_notifications: boolean;
}

export const NotificationSettings = () => {
  const { notifications, unreadCount } = useNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    whatsapp_enabled: true,
    new_order_notifications: true,
    low_stock_notifications: true,
    payment_notifications: true
  });

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const notificationTypes = [
    {
      key: 'new_order_notifications' as const,
      title: 'New Orders',
      description: 'Get notified when new orders are placed',
      icon: <Bell className="h-4 w-4" />,
    },
    {
      key: 'low_stock_notifications' as const,
      title: 'Low Stock Alerts',
      description: 'Get notified when products are running low',
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      key: 'payment_notifications' as const,
      title: 'Payment Updates',
      description: 'Get notified about payment confirmations',
      icon: <Bell className="h-4 w-4" />,
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Overview
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications about your store activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Delivery Methods</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-base">WhatsApp Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via WhatsApp
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.whatsapp_enabled}
                onCheckedChange={(checked) => updatePreference('whatsapp_enabled', checked)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Notification Types</h4>
            
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {type.icon}
                  <div>
                    <Label className="text-base">{type.title}</Label>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences[type.key]}
                  onCheckedChange={(checked) => updatePreference(type.key, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {notifications && notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Your latest store notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    notification.is_read ? 'bg-background' : 'bg-muted/50'
                  }`}
                >
                  <div className="mt-1">
                    {notification.type === 'new_order' && <Bell className="h-4 w-4 text-blue-500" />}
                    {notification.type === 'low_stock' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    {notification.type === 'payment_received' && <Bell className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};