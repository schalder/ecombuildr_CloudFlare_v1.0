import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useUserStore } from '@/hooks/useUserStore';
import { useDomainManagement } from '@/hooks/useDomainManagement';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ExternalLink, Globe, Settings, Upload, Image, Copy, Check, Plus } from 'lucide-react';

const CourseDomainSettings = () => {
  const navigate = useNavigate();
  const { store: userStore } = useUserStore();
  const { domains, connections, connectCourseContent, checkCourseSlugAvailability } = useDomainManagement();
  const { toast } = useToast();
  
  const [setupType, setSetupType] = useState<'integrated' | 'custom'>('integrated');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [customSlug, setCustomSlug] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Favicon states - single favicon for all course pages
  const [courseFavicon, setCourseFavicon] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string>('');

  const verifiedDomains = domains?.filter(d => d.is_verified && d.dns_configured) || [];

  // Auto-select first verified domain if none selected
  useEffect(() => {
    if (!selectedDomain && verifiedDomains.length > 0) {
      setSelectedDomain(verifiedDomains[0].id);
    }
  }, [verifiedDomains, selectedDomain]);

  const handleSlugCheck = async () => {
    if (!customSlug || !selectedDomain) return;
    
    setIsCheckingSlug(true);
    try {
      const domain = verifiedDomains.find(d => d.id === selectedDomain);
      if (domain) {
        const available = await checkCourseSlugAvailability(domain.id, customSlug);
        setSlugAvailable(available);
      }
    } catch (error) {
      console.error('Error checking slug availability:', error);
      toast({
        title: "Error",
        description: "Failed to check slug availability",
        variant: "destructive",
      });
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSetupCourse = async () => {
    if (!selectedDomain || (setupType === 'custom' && !customSlug)) return;
    
    setIsConnecting(true);
    try {
      const domain = verifiedDomains.find(d => d.id === selectedDomain);
      if (!domain) throw new Error('Domain not found');

      const path = setupType === 'integrated' ? '/courses' : `/${customSlug}`;
      
      await connectCourseContent(domain.id, 'course_area', userStore?.id || '', path);
      
      toast({
        title: "Success",
        description: "Course domain setup completed successfully!",
      });
    } catch (error) {
      console.error('Error setting up course domain:', error);
      toast({
        title: "Error",
        description: "Failed to setup course domain",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedUrl(''), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  };

  const handleVisitDomain = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <DashboardLayout title="Course Domain Settings" description="Configure course domains and favicon settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>

        {/* Current Course Domains */}
        {connections && connections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Current Course Domains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connections.map((connection, index) => {
                  const domain = verifiedDomains.find(d => d.id === connection.domain_id);
                  const fullUrl = `https://${domain?.domain}${connection.path || '/courses'}`;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Active</Badge>
                          <span className="font-medium">
                            {domain?.domain}{connection.path || '/courses'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyUrl(fullUrl)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedUrl === fullUrl ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Course marketplace and member portal
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={() => handleVisitDomain(fullUrl)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Visit
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Set Up Course Domain */}
        <Card>
          <CardHeader>
            <CardTitle>Set Up Course Domain</CardTitle>
            <CardDescription>
              Choose how you want to set up your course marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {verifiedDomains.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No verified domains</h3>
                <p className="text-muted-foreground mb-4">
                  You need to add and verify a custom domain first to set up course hosting.
                </p>
                <Button onClick={() => navigate('/dashboard/domains')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Domain</Label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {verifiedDomains.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.domain}
                      </option>
                    ))}
                  </select>
                </div>

                <RadioGroup value={setupType} onValueChange={(value) => setSetupType(value as 'integrated' | 'custom')}>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="integrated" id="integrated" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="integrated" className="font-medium">
                          Integrated with Store
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add courses to your existing store at /courses path
                        </p>
                        {setupType === 'integrated' && selectedDomain && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Course Library:</Label>
                              <code className="bg-muted px-2 py-1 rounded text-sm">
                                {verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyUrl(`https://${verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses`)}
                                className="h-6 w-6 p-0"
                              >
                                {copiedUrl === `https://${verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses` ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Member Portal:</Label>
                              <code className="bg-muted px-2 py-1 rounded text-sm">
                                {verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses/members
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyUrl(`https://${verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses/members`)}
                                className="h-6 w-6 p-0"
                              >
                                {copiedUrl === `https://${verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses/members` ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="custom" id="custom" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="custom" className="font-medium">
                          Dedicated Course Domain
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Use the entire domain exclusively for courses
                        </p>
                        {setupType === 'custom' && (
                          <div className="mt-3 space-y-2">
                            <Label htmlFor="custom-slug">Custom Path (optional)</Label>
                            <div className="flex gap-2">
                              <Input
                                id="custom-slug"
                                value={customSlug}
                                onChange={(e) => setCustomSlug(e.target.value)}
                                placeholder="e.g., learn, academy"
                              />
                              <Button 
                                variant="outline" 
                                onClick={handleSlugCheck}
                                disabled={!customSlug || isCheckingSlug}
                              >
                                {isCheckingSlug ? 'Checking...' : 'Check'}
                              </Button>
                            </div>
                            {slugAvailable !== null && (
                              <p className={`text-sm ${slugAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                {slugAvailable ? 'Slug is available!' : 'Slug is already taken'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex gap-4">
                  <Button 
                    onClick={handleSetupCourse}
                    disabled={
                      !selectedDomain || 
                      isConnecting ||
                      (setupType === 'custom' && customSlug && slugAvailable !== true)
                    }
                    className="flex-1"
                  >
                    {isConnecting ? 'Setting Up...' : 'Set Up Course Domain'}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard/courses')}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Favicon Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Course Pages Favicon
            </CardTitle>
            <CardDescription>
              Upload a single favicon that will be used for all course-related pages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course-favicon">Favicon for All Course Pages</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="course-favicon"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setCourseFavicon(url);
                        toast({
                          title: "Favicon uploaded",
                          description: "Course favicon has been updated for all pages.",
                        });
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('course-favicon')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Favicon
                  </Button>
                  {courseFavicon && (
                    <img 
                      src={courseFavicon} 
                      alt="Course Favicon" 
                      className="h-8 w-8 object-contain border rounded" 
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  This favicon will be used for:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Course Library page</li>
                  <li>Course Details page</li>
                  <li>Members Area</li>
                  <li>Course Login page</li>
                </ul>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Favicons should be square images (preferably 32x32 or 16x16 pixels) 
                in PNG or ICO format for best compatibility across browsers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CourseDomainSettings;