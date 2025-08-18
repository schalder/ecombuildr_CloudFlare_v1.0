import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertCircle, 
  MessageCircle, 
  Save,
  Settings,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SupportSettings {
  id?: string;
  whatsapp_number: string;
  welcome_message: string;
  is_enabled: boolean;
  widget_position: string;
  availability_message: string;
}

const AdminSupport = () => {
  const { isAdmin, loading } = useAdminData();
  const [settings, setSettings] = useState<SupportSettings>({
    whatsapp_number: '',
    welcome_message: 'Hi! I need help with my account.',
    is_enabled: false,
    widget_position: 'bottom-right',
    availability_message: "We'll get back to you as soon as possible!"
  });
  const [saving, setSaving] = useState(false);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchSupportSettings();
    }
  }, [isAdmin]);

  const fetchSupportSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_support_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching support settings:', error);
      } else if (data) {
        setSettings(data);
        setHasExistingSettings(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const saveSupportSettings = async () => {
    setSaving(true);
    try {
      if (hasExistingSettings) {
        const { error } = await supabase
          .from('platform_support_settings')
          .update({
            whatsapp_number: settings.whatsapp_number,
            welcome_message: settings.welcome_message,
            is_enabled: settings.is_enabled,
            widget_position: settings.widget_position,
            availability_message: settings.availability_message
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_support_settings')
          .insert([settings]);

        if (error) throw error;
        setHasExistingSettings(true);
      }

      toast.success('WhatsApp support settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || isAdmin === null) {
    return (
      <AdminLayout title="Support Center" description="Manage customer support tickets and inquiries">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Support Center">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to view this page. Only super admins can access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Support Center" description="Configure WhatsApp live chat for platform support">
      <div className="space-y-6">
        {/* WhatsApp Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              WhatsApp Live Chat Configuration
            </CardTitle>
            <CardDescription>
              Set up WhatsApp live chat to provide support to your platform users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable WhatsApp Widget</Label>
                <p className="text-sm text-muted-foreground">
                  Show WhatsApp chat widget on the main application and user dashboard
                </p>
              </div>
              <Switch
                checked={settings.is_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, is_enabled: checked }))
                }
              />
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="whatsapp_number">WhatsApp Business Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsapp_number"
                    placeholder="+1234567890"
                    value={settings.whatsapp_number}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      whatsapp_number: e.target.value 
                    }))}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Include country code (e.g., +1234567890)
                </p>
              </div>

              <div>
                <Label htmlFor="welcome_message">Welcome Message</Label>
                <Textarea
                  id="welcome_message"
                  placeholder="Hi! I need help with my account."
                  value={settings.welcome_message}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    welcome_message: e.target.value 
                  }))}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This message will be pre-filled when users click the WhatsApp button
                </p>
              </div>

              <div>
                <Label htmlFor="availability_message">Availability Message</Label>
                <Textarea
                  id="availability_message"
                  placeholder="We'll get back to you as soon as possible!"
                  value={settings.availability_message}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    availability_message: e.target.value 
                  }))}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Shown in the widget before users start a chat
                </p>
              </div>

              <div>
                <Label htmlFor="widget_position">Widget Position</Label>
                <Select
                  value={settings.widget_position}
                  onValueChange={(value) => setSettings(prev => ({ 
                    ...prev, 
                    widget_position: value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={saveSupportSettings}
                disabled={saving || !settings.whatsapp_number}
                className="min-w-32"
              >
                {saving ? (
                  <>
                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {settings.is_enabled && settings.whatsapp_number && (
          <Card>
            <CardHeader>
              <CardTitle>Widget Preview</CardTitle>
              <CardDescription>
                This is how the WhatsApp widget will appear to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted/30 rounded-lg p-8 min-h-48">
                <div className={`absolute ${settings.widget_position === 'bottom-left' ? 'bottom-6 left-6' : 'bottom-6 right-6'}`}>
                  <div className="mb-4 bg-background border rounded-lg shadow-lg p-4 max-w-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <MessageCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Need Help?</p>
                          <p className="text-xs text-muted-foreground">We're here to assist!</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {settings.availability_message}
                    </p>
                    <Button
                      disabled
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      size="sm"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Chat
                    </Button>
                  </div>
                  
                  <Button
                    disabled
                    className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
                  >
                    <MessageCircle className="h-6 w-6" />
                  </Button>
                </div>
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Widget Preview</p>
                  <p className="text-xs">Position: {settings.widget_position}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;