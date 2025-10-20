import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useUserStore } from '@/hooks/useUserStore';
import { useDomainManagement } from '@/hooks/useDomainManagement';
import { useToast } from '@/hooks/use-toast';
import { CompactMediaSelector } from '@/components/page-builder/components/CompactMediaSelector';
import { ArrowLeft, ExternalLink, Globe, Settings, Image, Copy, Check, Plus } from 'lucide-react';

const CourseDomainSettings = () => {
  const navigate = useNavigate();
  const { store: userStore } = useUserStore();
  const { domains, connections, connectCourseContent, checkCourseSlugAvailability, clearCourseConnections } = useDomainManagement();
  const { toast } = useToast();
  
  const [setupType, setSetupType] = useState<'integrated' | 'custom'>('integrated');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [customSlug, setCustomSlug] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string>('');

  const verifiedDomains = domains?.filter(d => d.is_verified && d.dns_configured) || [];

  // Load existing course connections on mount/connections change
  useEffect(() => {
    if (!connections || !userStore?.id) return;

    const courseConnection = connections.find(conn => 
      conn.content_type === 'course_area' && 
      conn.content_id === userStore.id
    );

    if (courseConnection) {
      setSelectedDomain(courseConnection.domain_id);
      
      if (courseConnection.path === '/courses') {
        setSetupType('integrated');
      } else if (courseConnection.path && courseConnection.path !== '/') {
        setSetupType('custom');
        setCustomSlug(courseConnection.path.slice(1)); // Remove leading slash
      }
    } else {
      setSelectedDomain('');
      setSetupType('integrated');
      setCustomSlug('');
    }
  }, [connections, userStore?.id]);

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
    if (setupType === 'custom' && selectedDomain && !customSlug) return;
    
    setIsConnecting(true);
    try {
      // Clear existing course connections first
      await clearCourseConnections();

      // If no domain selected, use system domain (just clear connections)
      if (!selectedDomain) {
        toast({
          title: "Success!",
          description: "Course will use the system domain.",
        });
        navigate('/dashboard/courses');
        return;
      }

      // Connect to custom domain
      const domain = verifiedDomains.find(d => d.id === selectedDomain);
      if (!domain) throw new Error('Domain not found');

      const path = setupType === 'integrated' ? '/courses' : `/${customSlug}`;
      
      await connectCourseContent(domain.id, 'course_area', userStore?.id || '', path);
      
      toast({
        title: "Success",
        description: "Course domain setup completed successfully!",
      });
      
      navigate('/dashboard/courses');
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
                  <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None (Use System Domain)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (Use System Domain)</SelectItem>
                      {verifiedDomains.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        {setupType === 'integrated' && (
                          <div className="mt-3 space-y-2">
                             <div className="flex items-center gap-2">
                               <Label className="text-sm">Course Library:</Label>
                                <code className="bg-muted px-2 py-1 rounded text-sm">
                                  {selectedDomain
                                    ? `${verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses`
                                    : `ecombuildr.com/course/${userStore?.id}`
                                  }
                                </code>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                  onClick={() => handleCopyUrl(selectedDomain
                                    ? `https://${verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses`
                                    : `https://ecombuildr.com/course/${userStore?.id}`
                                  )}
                                 className="h-6 w-6 p-0"
                               >
                                  {copiedUrl === (selectedDomain
                                    ? `https://${verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses`
                                    : `https://ecombuildr.com/course/${userStore?.id}`
                                  ) ? (
                                   <Check className="h-3 w-3 text-green-500" />
                                 ) : (
                                   <Copy className="h-3 w-3" />
                                 )}
                               </Button>
                             </div>
                             <div className="flex items-center gap-2">
                               <Label className="text-sm">Member Portal:</Label>
                                <code className="bg-muted px-2 py-1 rounded text-sm">
                                  {selectedDomain
                                    ? `${verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses/members`
                                    : `ecombuildr.com/course/${userStore?.id}/members`
                                  }
                                </code>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                  onClick={() => handleCopyUrl(selectedDomain
                                    ? `https://${verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses/members`
                                    : `https://ecombuildr.com/course/${userStore?.id}/members`
                                  )}
                                 className="h-6 w-6 p-0"
                               >
                                  {copiedUrl === (selectedDomain
                                    ? `https://${verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses/members`
                                    : `https://ecombuildr.com/course/${userStore?.id}/members`
                                  ) ? (
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
                                className="text-foreground"
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
                        isConnecting ||
                        (setupType === 'custom' && selectedDomain && customSlug && slugAvailable !== true)
                      }
                     className="flex-1"
                   >
                     {isConnecting ? 'Setting Up...' : (selectedDomain ? 'Set Up Course Domain' : 'Use System Domain')}
                   </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard/courses')}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default CourseDomainSettings;