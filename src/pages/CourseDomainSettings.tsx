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
import { ArrowLeft, ExternalLink, Globe, Settings } from 'lucide-react';

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

  const handleSetupCourses = async () => {
    if (!userStore || !selectedDomain) return;

    setIsConnecting(true);
    try {
      const domain = verifiedDomains.find(d => d.id === selectedDomain);
      if (!domain) return;

      if (setupType === 'integrated') {
        // Set up integrated course area
        await connectCourseContent(domain.id, 'course_area', userStore.id, '/courses', false);
        
        toast({
          title: "Course Domain Setup Complete",
          description: `Courses are now available at ${domain.domain}/courses`,
        });
      } else if (setupType === 'custom') {
        // Set up custom course domain (entire domain for courses)
        await connectCourseContent(domain.id, 'course_area', userStore.id, '', true);
        
        toast({
          title: "Course Domain Setup Complete",
          description: `Courses are now available at ${domain.domain}`,
        });
      }

      navigate('/dashboard/courses');
    } catch (error) {
      console.error('Error setting up course domain:', error);
      toast({
        title: "Error",
        description: "Failed to set up course domain",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const existingCourseConnections = connections?.filter(c => 
    c.content_type === 'course_area'
  ) || [];

  return (
    <DashboardLayout title="Course Domain Settings" description="Set up a custom domain for your course marketplace">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/courses')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
        </div>

        {existingCourseConnections.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Current Course Domains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingCourseConnections.map((connection) => {
                  const domain = domains?.find(d => d.id === connection.domain_id);
                  return (
                    <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Active</Badge>
                          <span className="font-medium">
                            {domain?.domain}{connection.path || '/courses'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Course marketplace and member portal
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
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

        {verifiedDomains.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Verified Domains</CardTitle>
              <CardDescription>
                You need to set up and verify a custom domain before you can configure course domains.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/dashboard/domains')}>
                Set Up Custom Domain
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Set Up Course Domain</CardTitle>
              <CardDescription>
                Choose how you want to set up your course marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Select Domain</Label>
                <select
                  className="w-full mt-1 p-2 border rounded-lg"
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                >
                  <option value="">Choose a domain...</option>
                  {verifiedDomains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.domain}
                    </option>
                  ))}
                </select>
              </div>

              <Separator />

              <RadioGroup value={setupType} onValueChange={(value: 'integrated' | 'custom') => setSetupType(value)}>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="integrated" id="integrated" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="integrated" className="font-medium">
                        Integrated with Store
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add courses to your existing store at <code>/courses</code> path
                      </p>
                      {selectedDomain && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          Course Library: <code>{verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses</code><br />
                          Member Portal: <code>{verifiedDomains.find(d => d.id === selectedDomain)?.domain}/courses/members</code>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="custom" id="custom" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="custom" className="font-medium">
                        Dedicated Course Domain
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use the entire domain exclusively for courses
                      </p>
                      {setupType === 'custom' && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <Label>Custom Slug (optional)</Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                placeholder="my-courses"
                                value={customSlug}
                                onChange={(e) => {
                                  setCustomSlug(e.target.value);
                                  setSlugAvailable(null);
                                }}
                              />
                              <Button
                                onClick={handleSlugCheck}
                                disabled={!customSlug || !selectedDomain || isCheckingSlug}
                                variant="outline"
                              >
                                {isCheckingSlug ? 'Checking...' : 'Check'}
                              </Button>
                            </div>
                            {slugAvailable === true && (
                              <p className="text-sm text-green-600 mt-1">✓ Slug is available</p>
                            )}
                            {slugAvailable === false && (
                              <p className="text-sm text-red-600 mt-1">✗ Slug is already taken</p>
                            )}
                          </div>
                          {selectedDomain && (
                            <div className="p-2 bg-muted rounded text-sm">
                              Course Library: <code>{verifiedDomains.find(d => d.id === selectedDomain)?.domain}{customSlug ? `/${customSlug}` : ''}</code><br />
                              Member Portal: <code>{verifiedDomains.find(d => d.id === selectedDomain)?.domain}{customSlug ? `/${customSlug}` : ''}/members</code>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </RadioGroup>

              <Separator />

              <div className="flex gap-3">
                <Button
                  onClick={handleSetupCourses}
                  disabled={
                    !selectedDomain || !userStore || 
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
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CourseDomainSettings;