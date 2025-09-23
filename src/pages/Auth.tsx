import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSEO } from '@/hooks/useSEO';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { validateSignupData, checkPhoneExists, type EmailValidationResult, type DuplicateCheckResult } from '@/lib/auth-validation';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const { seoData } = useSEO('auth');
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '', fullName: '', phone: '', confirmPassword: '' });
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [defaultTab, setDefaultTab] = useState("signin");
  const [emailValidation, setEmailValidation] = useState<EmailValidationResult | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [phoneValidation, setPhoneValidation] = useState<{ isChecking: boolean; isDuplicate: boolean } | null>(null);

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan) {
      setSelectedPlan(plan);
      setDefaultTab("signup");
    }
  }, [searchParams]);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInData.email || !signInData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(signInData.email, signInData.password);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationErrors([]);
    setEmailValidation(null);
    setDuplicateCheck(null);

    try {
      // Comprehensive validation
      const validationResult = await validateSignupData(
        signUpData.email,
        signUpData.phone,
        signUpData.password,
        signUpData.confirmPassword,
        signUpData.fullName
      );

      setEmailValidation(validationResult.emailValidation || null);
      setDuplicateCheck(validationResult.duplicateCheck || null);
      setValidationErrors(validationResult.errors);

      if (!validationResult.isValid) {
        if (validationResult.duplicateCheck?.isDuplicate) {
          // Handle duplicate account case
          if (validationResult.duplicateCheck.action === 'LOGIN') {
            toast({
              title: "Account Already Exists",
              description: validationResult.duplicateCheck.message,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Duplicate Information",
              description: validationResult.duplicateCheck.message,
              variant: "destructive",
            });
          }
        } else if (validationResult.errors.length > 0) {
          toast({
            title: "Validation Error",
            description: validationResult.errors[0],
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      // Use corrected email if suggested
      const emailToUse = validationResult.emailValidation?.correctedEmail || signUpData.email;
      
      // Proceed with signup
      const { error } = await signUp(emailToUse, signUpData.password, signUpData.fullName, signUpData.phone, selectedPlan);
      
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Signup validation error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleEmailCorrection = (correctedEmail: string) => {
    setSignUpData({ ...signUpData, email: correctedEmail });
    setEmailValidation(null);
  };

  const switchToLogin = () => {
    setDefaultTab("signin");
    setSignInData({ ...signInData, email: signUpData.email });
    setValidationErrors([]);
    setEmailValidation(null);
    setDuplicateCheck(null);
  };

  // Real-time phone validation with debouncing
  useEffect(() => {
    if (!signUpData.phone || signUpData.phone.length < 10) {
      setPhoneValidation(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setPhoneValidation({ isChecking: true, isDuplicate: false });
      
      try {
        const exists = await checkPhoneExists(signUpData.phone);
        setPhoneValidation({ isChecking: false, isDuplicate: exists });
      } catch (error) {
        console.error('Error checking phone:', error);
        setPhoneValidation({ isChecking: false, isDuplicate: false });
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [signUpData.phone]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <SEOHead
        title={seoData?.title}
        description={seoData?.description}
        ogImage={seoData?.og_image}
        keywords={seoData?.keywords}
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center mb-4 hover:opacity-80 transition-opacity">
            <img 
              src="https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-logo-big_vifrmg.png" 
              alt="EcomBuildr Logo" 
              className="h-12 w-auto"
            />
          </Link>
          <p className="text-muted-foreground">
            Build your e-commerce store in minutes
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPlan && (
              <div className="mb-4 p-3 bg-accent/10 rounded-md border border-accent/20">
                <p className="text-sm text-center">
                  <span className="font-medium text-accent">Selected Plan:</span> {selectedPlan}
                </p>
              </div>
            )}
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Validation Alerts */}
                  {emailValidation?.suggestedCorrection && (
                    <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Did you mean <strong>{emailValidation.correctedEmail}</strong>?{' '}
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-yellow-700 underline"
                          onClick={() => handleEmailCorrection(emailValidation.correctedEmail!)}
                        >
                          Use this instead
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {duplicateCheck?.isDuplicate && duplicateCheck.action === 'LOGIN' && (
                    <Alert variant="info">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {duplicateCheck.message}{' '}
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-blue-700 underline"
                          onClick={switchToLogin}
                        >
                          Sign in here
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {duplicateCheck?.isDuplicate && duplicateCheck.action === 'USE_DIFFERENT_PHONE' && (
                    <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {duplicateCheck.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpData.email}
                      onChange={(e) => {
                        setSignUpData({ ...signUpData, email: e.target.value });
                        // Clear validation states when user modifies email
                        if (emailValidation || duplicateCheck) {
                          setEmailValidation(null);
                          setDuplicateCheck(null);
                          setValidationErrors([]);
                        }
                      }}
                      disabled={isLoading}
                      className={emailValidation?.suggestedCorrection ? 'border-yellow-500' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <div className="relative">
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="Phone Number (01xxxxxxxxx)"
                        value={signUpData.phone}
                        onChange={(e) => {
                          setSignUpData({ ...signUpData, phone: e.target.value });
                          // Clear validation states when user modifies phone
                          if (duplicateCheck?.type === 'phone') {
                            setDuplicateCheck(null);
                            setValidationErrors([]);
                          }
                        }}
                        disabled={isLoading}
                        required
                        className={phoneValidation?.isDuplicate ? "border-destructive" : ""}
                      />
                      {phoneValidation?.isChecking && (
                        <div className="absolute right-3 top-3">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Real-time phone validation alert */}
                  {phoneValidation?.isDuplicate && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="space-y-2">
                        <p>This phone number is already registered with another account.</p>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setDefaultTab("signin");
                              setSignInData(prev => ({ ...prev, email: signUpData.email }));
                            }}
                          >
                            Sign In Instead
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSignUpData(prev => ({ ...prev, phone: '' }));
                              setPhoneValidation(null);
                            }}
                          >
                            Use Different Phone
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || phoneValidation?.isDuplicate || phoneValidation?.isChecking}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            By signing up, you agree to our{" "}
            <Link to="/terms-of-service" className="underline hover:text-primary transition-colors">
              Terms of Service
            </Link>
            {" "}and{" "}
            <Link to="/privacy-policy" className="underline hover:text-primary transition-colors">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;