import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface Website {
  id: string;
  name: string;
  settings: any;
}

interface WebsiteFOMOProps {
  website: Website;
}

export const WebsiteFOMO: React.FC<WebsiteFOMOProps> = ({ website }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current FOMO settings from website settings
  const fomoSettings = website.settings?.fomo || {};

  const [settings, setSettings] = useState({
    enabled: fomoSettings.enabled || false,
    position: fomoSettings.position || 'bottom-left',
    textColor: fomoSettings.textColor || '#ffffff',
    backgroundColor: fomoSettings.backgroundColor || '#1a1a1a',
    iconUrl: fomoSettings.iconUrl || '',
    displayDuration: fomoSettings.displayDuration || 5000,
    delayBetween: fomoSettings.delayBetween || 3000,
    maxRecentOrders: fomoSettings.maxRecentOrders || 10,
    showProductImage: fomoSettings.showProductImage !== false,
    animationStyle: fomoSettings.animationStyle || 'slide-left',
    clickAction: fomoSettings.clickAction || 'product',
    timeFormat: fomoSettings.timeFormat || 'relative'
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      const updatedSettings = {
        ...website.settings,
        fomo: newSettings
      };

      const { error } = await supabase
        .from('websites')
        .update({ settings: updatedSettings })
        .eq('id', website.id);

      if (error) throw error;
      return updatedSettings;
    },
    onSuccess: () => {
      toast({
        title: 'FOMO settings saved',
        description: 'Your FOMO notification settings have been updated.'
      });
      queryClient.invalidateQueries({ queryKey: ['website', website.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving settings',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">FOMO Notifications</h2>
        <p className="text-muted-foreground">
          Boost conversions with social proof notifications showing recent purchases.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FOMO Settings</CardTitle>
          <CardDescription>
            Configure how purchase notifications appear on your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable FOMO */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable FOMO Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show purchase notifications to visitors
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
            />
          </div>

          <Separator />

          {/* Position */}
          <div className="space-y-2">
            <Label>Position</Label>
            <Select 
              value={settings.position} 
              onValueChange={(value) => handleSettingChange('position', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={settings.textColor}
                  onChange={(e) => handleSettingChange('textColor', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={settings.textColor}
                  onChange={(e) => handleSettingChange('textColor', e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                  placeholder="#1a1a1a"
                />
              </div>
            </div>
          </div>

          {/* Icon URL */}
          <div className="space-y-2">
            <Label>Icon URL (Optional)</Label>
            <Input
              type="url"
              value={settings.iconUrl}
              onChange={(e) => handleSettingChange('iconUrl', e.target.value)}
              placeholder="https://example.com/icon.png"
            />
            <p className="text-sm text-muted-foreground">
              Custom icon to display with notifications. Leave empty for no icon.
            </p>
          </div>

          {/* Timing Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Duration (seconds)</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={settings.displayDuration / 1000}
                onChange={(e) => handleSettingChange('displayDuration', parseInt(e.target.value) * 1000)}
              />
              <p className="text-sm text-muted-foreground">
                How long each notification stays visible
              </p>
            </div>

            <div className="space-y-2">
              <Label>Delay Between Notifications (seconds)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={settings.delayBetween / 1000}
                onChange={(e) => handleSettingChange('delayBetween', parseInt(e.target.value) * 1000)}
              />
              <p className="text-sm text-muted-foreground">
                Time between showing notifications
              </p>
            </div>
          </div>

          {/* Max Recent Orders */}
          <div className="space-y-2">
            <Label>Number of Recent Orders to Show</Label>
            <Input
              type="number"
              min="1"
              max="50"
              value={settings.maxRecentOrders}
              onChange={(e) => handleSettingChange('maxRecentOrders', parseInt(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of recent orders to cycle through
            </p>
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Product Images</Label>
                <p className="text-sm text-muted-foreground">
                  Display product images in notifications
                </p>
              </div>
              <Switch
                checked={settings.showProductImage}
                onCheckedChange={(checked) => handleSettingChange('showProductImage', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Animation Style</Label>
              <Select 
                value={settings.animationStyle} 
                onValueChange={(value) => handleSettingChange('animationStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slide-left">Slide from Left</SelectItem>
                  <SelectItem value="slide-right">Slide from Right</SelectItem>
                  <SelectItem value="slide-bottom">Slide from Bottom</SelectItem>
                  <SelectItem value="fade">Fade In</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Click Action</Label>
              <Select 
                value={settings.clickAction} 
                onValueChange={(value) => handleSettingChange('clickAction', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Go to Product</SelectItem>
                  <SelectItem value="close">Close Notification</SelectItem>
                  <SelectItem value="none">No Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {settings.enabled && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div 
                className="p-4 rounded-lg shadow-lg max-w-sm flex items-center space-x-3"
                style={{ 
                  backgroundColor: settings.backgroundColor, 
                  color: settings.textColor 
                }}
              >
                {settings.showProductImage && (
                  <div className="w-12 h-12 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs">IMG</span>
                  </div>
                )}
                {settings.iconUrl && (
                  <img src={settings.iconUrl} alt="Icon" className="w-6 h-6 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">John from Dhaka</p>
                  <p className="text-xs opacity-90 truncate">purchased Premium T-Shirt</p>
                  <p className="text-xs opacity-75">5 minutes ago</p>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save FOMO Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};