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
                      value={
                        marketingContent?.iframe_embed_code 
                          ? 'iframe' 
                          : marketingContent?.youtube_url 
                            ? 'youtube' 
                            : 'none'
                      }
                      onValueChange={(value) => {
                        if (value === 'youtube') {
                          updateContent('hero', { 
                            youtube_url: marketingContent?.youtube_url || '',
                            iframe_embed_code: '', // Clear iframe when switching to YouTube
                            hero_image_url: marketingContent?.hero_image_url 
                          });
                        } else if (value === 'iframe') {
                          updateContent('hero', { 
                            youtube_url: '', // Clear YouTube when switching to iframe
                            iframe_embed_code: marketingContent?.iframe_embed_code || '',
                            hero_image_url: marketingContent?.hero_image_url 
                          });
                        } else {
                          updateContent('hero', { 
                            youtube_url: '',
                            iframe_embed_code: '',
                            hero_image_url: marketingContent?.hero_image_url 
                          });
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

                  {(() => {
                    const currentValue = marketingContent?.iframe_embed_code 
                      ? 'iframe' 
                      : marketingContent?.youtube_url 
                        ? 'youtube' 
                        : 'none';
                    
                    if (currentValue === 'youtube') {
                      return (
                        <div className="space-y-2">
                          <Label htmlFor="youtube_url">YouTube Video URL</Label>
                          <Input
                            id="youtube_url"
                            value={marketingContent?.youtube_url || ''}
                            onChange={(e) => {
                              updateContent('hero', { 
                                youtube_url: e.target.value,
                                iframe_embed_code: '',
                                hero_image_url: marketingContent?.hero_image_url 
                              });
                            }}
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                          <p className="text-sm text-muted-foreground">
                            Video will be shown with controls, no autoplay. Leave empty to use image fallback.
                          </p>
                        </div>
                      );
                    }
                    
                    if (currentValue === 'iframe') {
                      return (
                        <div className="space-y-2">
                          <Label htmlFor="iframe_embed_code">Custom Iframe Embed Code</Label>
                          <Textarea
                            id="iframe_embed_code"
                            value={marketingContent?.iframe_embed_code || ''}
                            onChange={(e) => {
                              updateContent('hero', { 
                                youtube_url: '',
                                iframe_embed_code: e.target.value,
                                hero_image_url: marketingContent?.hero_image_url 
                              });
                            }}
                            placeholder="<iframe src=&quot;https://flexplayer.ghlsaaskits.com/embed/...&quot; frameborder=&quot;0&quot; allowfullscreen></iframe>"
                            rows={4}
                            className="font-mono text-sm"
                          />
                          <p className="text-sm text-muted-foreground">
                            Paste your custom iframe embed code here. This will override YouTube video if both are set.
                          </p>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                </div>

                <div className="space-y-2">
                  <Label>Hero Fallback Image</Label>
                  <ImageUpload
                    value={marketingContent?.hero_image_url || ''}
                    onChange={(url) => {
                      updateContent('hero', { 
                        youtube_url: marketingContent?.youtube_url,
                        hero_image_url: url 
                      });
                    }}
                    label="Upload hero image"
                  />
                  <p className="text-sm text-muted-foreground">
                    This image will be shown if no YouTube video is set or video fails to load.
                  </p>
                </div>

                {marketingContent && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Debug Info:</h4>
                    <p className="text-xs text-muted-foreground">
                      YouTube URL: {marketingContent?.youtube_url || 'None'}<br/>
                      Iframe Code: {marketingContent?.iframe_embed_code || 'None'}<br/>
                      Hero Image: {marketingContent?.hero_image_url || 'None'}
                    </p>
                  </div>
                )}

                {marketingContent && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Current Configuration:</h4>
                    <p className="text-sm text-muted-foreground">
                      {(() => {
                        const currentValue = marketingContent?.iframe_embed_code 
                          ? 'iframe' 
                          : marketingContent?.youtube_url 
                            ? 'youtube' 
                            : 'none';
                        
                        if (currentValue === 'iframe') {
                          return 'Custom Iframe Player';
                        } else if (currentValue === 'youtube') {
                          return `YouTube Video: ${marketingContent?.youtube_url}`;
                        } else if (marketingContent?.hero_image_url) {
                          return `Image: ${marketingContent.hero_image_url.split('/').pop()}`;
                        } else {
                          return 'Default image will be used';
                        }
                      })()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSystemSettings;