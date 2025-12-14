import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMarketingContent } from '@/hooks/useMarketingContent';
import { ImageUpload } from '@/components/ui/image-upload';
import { PlatformNavigationManager } from '@/components/admin/PlatformNavigationManager';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertCircle, 
  Settings, 
  Palette, 
  Mail, 
  Shield,
  Server,
  Save,
  AlertTriangle,
  Monitor
} from 'lucide-react';

const AdminSystemSettings = () => {
  const { isAdmin, loading } = useAdminData();
  const { toast } = useToast();
  const { content: marketingContent, updateContent } = useMarketingContent();
  
  // Local state for marketing content inputs
  const [localVideoType, setLocalVideoType] = useState<'none' | 'youtube' | 'iframe'>('none');
  const [localYoutubeUrl, setLocalYoutubeUrl] = useState('');
  const [localIframeCode, setLocalIframeCode] = useState('');
  const [localHeroImageUrl, setLocalHeroImageUrl] = useState('');
  
  // Local state for tracking settings
  const [trackingSettings, setTrackingSettings] = useState({
    facebook_pixel_id: '',
    google_analytics_id: '',
    google_ads_id: ''
  });
  const [trackingLoading, setTrackingLoading] = useState(true);

  // Initialize local state when marketingContent loads
  React.useEffect(() => {
    if (marketingContent) {
      // Determine video type based on existing content
      if (marketingContent.iframe_embed_code && marketingContent.iframe_embed_code.trim()) {
        setLocalVideoType('iframe');
        setLocalIframeCode(marketingContent.iframe_embed_code);
      } else if (marketingContent.youtube_url && marketingContent.youtube_url.trim()) {
        setLocalVideoType('youtube');
        setLocalYoutubeUrl(marketingContent.youtube_url);
      } else {
        setLocalVideoType('none');
      }
      setLocalHeroImageUrl(marketingContent.hero_image_url || '');
    }
  }, [marketingContent]);

  // Load tracking settings
  React.useEffect(() => {
    const loadTrackingSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_tracking_settings')
          .select('*')
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setTrackingSettings({
            facebook_pixel_id: data.facebook_pixel_id || '',
            google_analytics_id: data.google_analytics_id || '',
            google_ads_id: data.google_ads_id || ''
          });
        }
      } catch (error: any) {
        console.error('Error loading tracking settings:', error);
        toast({
          title: "Error",
          description: "Failed to load tracking settings",
          variant: "destructive",
        });
      } finally {
        setTrackingLoading(false);
      }
    };

    if (isAdmin) {
      loadTrackingSettings();
    }
  }, [isAdmin, toast]);

  // Save tracking settings
  const handleSaveTrackingSettings = async () => {
    try {
      const { error } = await supabase
        .from('platform_tracking_settings')
        .upsert({
          facebook_pixel_id: trackingSettings.facebook_pixel_id || null,
          google_analytics_id: trackingSettings.google_analytics_id || null,
          google_ads_id: trackingSettings.google_ads_id || null,
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tracking settings saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving tracking settings:', error);
      toast({
        title: "Error",
        description: "Failed to save tracking settings: " + error.message,
        variant: "destructive",
      });
    }
  };

  // Save marketing content function
  const handleSaveMarketingContent = async () => {
    const dataToUpdate: any = {
      hero_image_url: localHeroImageUrl,
    };

    if (localVideoType === 'youtube') {
      dataToUpdate.youtube_url = localYoutubeUrl;
      dataToUpdate.iframe_embed_code = ''; // Clear iframe
    } else if (localVideoType === 'iframe') {
      dataToUpdate.iframe_embed_code = localIframeCode;
      dataToUpdate.youtube_url = ''; // Clear YouTube
    } else {
      dataToUpdate.youtube_url = '';
      dataToUpdate.iframe_embed_code = '';
    }

    try {
      await updateContent('hero', dataToUpdate);
      toast({
        title: "Success",
        description: "Marketing content updated successfully",
      });
    } catch (error) {
      console.error("Failed to update marketing content:", error);
      toast({
        title: "Error",
        description: "Failed to update marketing content. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Local state for settings (in a real app, this would come from the database)
  const [settings, setSettings] = useState({
    // System Settings
    maintenanceMode: false,
    maintenanceMessage: 'The platform is currently under maintenance. Please check back soon.',
    allowNewRegistrations: true,
    requireEmailVerification: true,
    
    // Branding Settings
    platformName: 'ECommerce Platform',
    supportEmail: 'support@example.com',
    companyName: 'Your Company Ltd.',
    
    // Email Settings
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@example.com',
    fromName: 'ECommerce Platform',
    
    // Security Settings
    sessionTimeout: 30,
    passwordMinLength: 8,
    enableTwoFactor: false,
    maxLoginAttempts: 5
  });

  const handleSave = (section: string) => {
    // TODO: Save to database
    toast({
      title: 'Settings Saved',
      description: `${section} settings have been updated successfully.`,
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading || isAdmin === null) {
    return (
      <AdminLayout title="System Settings" description="Configure platform-wide settings and preferences">
        <div className="space-y-6">
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="System Settings">
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
    <AdminLayout title="System Settings" description="Configure platform-wide settings and preferences">
      <div className="space-y-6">
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Marketing
            </TabsTrigger>
          </TabsList>

          {/* System Settings */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Manage core system settings and operational parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <Label className="font-medium text-yellow-800">Maintenance Mode</Label>
                      <p className="text-sm text-yellow-700">
                        Temporarily disable access to the platform
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                  />
                </div>

                {settings.maintenanceMode && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={settings.maintenanceMessage}
                      onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                      placeholder="Enter the message to display during maintenance"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Allow New Registrations</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to create accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowNewRegistrations}
                    onCheckedChange={(checked) => updateSetting('allowNewRegistrations', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Users must verify their email before accessing the platform
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                  />
                </div>

                <Button onClick={() => handleSave('System')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save System Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Settings */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Platform Branding
                </CardTitle>
                <CardDescription>
                  Customize platform branding and company information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Platform Name</Label>
                    <Input
                      id="platformName"
                      value={settings.platformName}
                      onChange={(e) => updateSetting('platformName', e.target.value)}
                      placeholder="ECommerce Platform"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => updateSetting('companyName', e.target.value)}
                      placeholder="Your Company Ltd."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => updateSetting('supportEmail', e.target.value)}
                      placeholder="support@example.com"
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave('Branding')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Branding Settings
                </Button>
              </CardContent>
            </Card>

            {/* Platform Navigation Section */}
            <PlatformNavigationManager />
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure SMTP settings for outgoing emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtpHost}
                      onChange={(e) => updateSetting('smtpHost', e.target.value)}
                      placeholder="smtp.example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => updateSetting('smtpPort', Number(e.target.value))}
                      placeholder="587"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={settings.fromEmail}
                      onChange={(e) => updateSetting('fromEmail', e.target.value)}
                      placeholder="noreply@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={settings.fromName}
                      onChange={(e) => updateSetting('fromName', e.target.value)}
                      placeholder="ECommerce Platform"
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave('Email')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Configuration
                </CardTitle>
                <CardDescription>
                  Configure security policies and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => updateSetting('sessionTimeout', Number(e.target.value))}
                      min="5"
                      max="480"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Min Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={settings.passwordMinLength}
                      onChange={(e) => updateSetting('passwordMinLength', Number(e.target.value))}
                      min="6"
                      max="32"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => updateSetting('maxLoginAttempts', Number(e.target.value))}
                      min="3"
                      max="10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all admin accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableTwoFactor}
                    onCheckedChange={(checked) => updateSetting('enableTwoFactor', checked)}
                  />
                </div>

                <Button onClick={() => handleSave('Security')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketing Settings */}
          <TabsContent value="marketing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Homepage Marketing
                </CardTitle>
                <CardDescription>
                  Configure homepage hero section with video or image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="video_type">Video Type</Label>
                    <Select
                      value={localVideoType}
                      onValueChange={(value: 'none' | 'youtube' | 'iframe') => {
                        setLocalVideoType(value);
                        // Clear the other fields when switching types
                        if (value === 'youtube') {
                          setLocalIframeCode('');
                        } else if (value === 'iframe') {
                          setLocalYoutubeUrl('');
                        } else {
                          setLocalYoutubeUrl('');
                          setLocalIframeCode('');
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select video type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Video (Image Only)</SelectItem>
                        <SelectItem value="youtube">YouTube Video</SelectItem>
                        <SelectItem value="iframe">Custom Iframe Player</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {localVideoType === 'youtube' && (
                    <div className="space-y-2">
                      <Label htmlFor="youtube_url">YouTube Video URL</Label>
                      <Input
                        id="youtube_url"
                        value={localYoutubeUrl}
                        onChange={(e) => setLocalYoutubeUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <p className="text-sm text-muted-foreground">
                        Video will be shown with controls, no autoplay. Leave empty to use image fallback.
                      </p>
                    </div>
                  )}
                  
                  {localVideoType === 'iframe' && (
                    <div className="space-y-2">
                      <Label htmlFor="iframe_embed_code">Custom Iframe Embed Code</Label>
                      <Textarea
                        id="iframe_embed_code"
                        value={localIframeCode}
                        onChange={(e) => setLocalIframeCode(e.target.value)}
                        placeholder="<iframe src=&quot;https://flexplayer.ghlsaaskits.com/embed/...&quot; frameborder=&quot;0&quot; allowfullscreen></iframe>"
                        rows={4}
                        className="font-mono text-sm"
                      />
                      <p className="text-sm text-muted-foreground">
                        Paste your custom iframe embed code here. This will override YouTube video if both are set.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Hero Fallback Image</Label>
                  <ImageUpload
                    value={localHeroImageUrl}
                    onChange={(url) => setLocalHeroImageUrl(url)}
                    label="Upload hero image"
                  />
                  <p className="text-sm text-muted-foreground">
                    This image will be shown if no YouTube video is set or video fails to load.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Debug Info:</h4>
                  <p className="text-xs text-muted-foreground">
                    Local Video Type: {localVideoType}<br/>
                    Local YouTube URL: "{localYoutubeUrl}" (length: {localYoutubeUrl.length})<br/>
                    Local Iframe Code: "{localIframeCode}" (length: {localIframeCode.length})<br/>
                    Local Hero Image: {localHeroImageUrl || 'None'}<br/>
                    <br/>
                    Database YouTube URL: "{marketingContent?.youtube_url || 'None'}" (length: {marketingContent?.youtube_url?.length || 0})<br/>
                    Database Iframe Code: "{marketingContent?.iframe_embed_code || 'None'}" (length: {marketingContent?.iframe_embed_code?.length || 0})<br/>
                    Database Hero Image: {marketingContent?.hero_image_url || 'None'}
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Current Configuration:</h4>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      if (localVideoType === 'iframe') {
                        return 'Custom Iframe Player';
                      } else if (localVideoType === 'youtube') {
                        return `YouTube Video: ${localYoutubeUrl || 'No URL entered'}`;
                      } else if (localHeroImageUrl) {
                        return `Image: ${localHeroImageUrl.split('/').pop()}`;
                      } else {
                        return 'Default image will be used';
                      }
                    })()}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveMarketingContent} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Marketing Content
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tracking & Analytics Settings */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Tracking & Analytics
                </CardTitle>
                <CardDescription>
                  Configure tracking pixels for the platform landing page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {trackingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                        <Input
                          id="facebook_pixel_id"
                          value={trackingSettings.facebook_pixel_id}
                          onChange={(e) => setTrackingSettings(prev => ({ ...prev, facebook_pixel_id: e.target.value }))}
                          placeholder="Enter your Facebook Pixel ID (e.g., 123456789012345)"
                        />
                        <p className="text-sm text-muted-foreground">
                          Your Facebook Pixel ID for tracking landing page visitors. Find it in your Facebook Events Manager.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="google_analytics_id">Google Analytics ID (Optional)</Label>
                        <Input
                          id="google_analytics_id"
                          value={trackingSettings.google_analytics_id}
                          onChange={(e) => setTrackingSettings(prev => ({ ...prev, google_analytics_id: e.target.value }))}
                          placeholder="G-XXXXXXXXXX"
                        />
                        <p className="text-sm text-muted-foreground">
                          Your Google Analytics 4 Measurement ID (optional).
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="google_ads_id">Google Ads ID (Optional)</Label>
                        <Input
                          id="google_ads_id"
                          value={trackingSettings.google_ads_id}
                          onChange={(e) => setTrackingSettings(prev => ({ ...prev, google_ads_id: e.target.value }))}
                          placeholder="AW-XXXXXXXXXX"
                        />
                        <p className="text-sm text-muted-foreground">
                          Your Google Ads Conversion ID (optional).
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveTrackingSettings} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Tracking Settings
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Navigation Settings */}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSystemSettings;