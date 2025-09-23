import { useState, useEffect, useCallback } from 'react';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSEO } from '@/hooks/useSEO';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Store, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { validateSignupData, checkEmailTypo, normalizePhoneNumber } from '@/utils/authValidation';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const { seoData } = useSEO('auth');
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '', fullName: '', phone: '', confirmPassword: '' });
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [defaultTab, setDefaultTab] = useState("signin");
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [showEmailSuggestion, setShowEmailSuggestion] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [emailValidated, setEmailValidated] = useState(false);
  const [phoneValidated, setPhoneValidated] = useState(false);

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

  // Debounced email validation
  const debouncedEmailValidation = useCallback(
    async (email: string) => {
      if (!email || !email.includes('@')) {
        setEmailValidated(false);
        return;
      }

      const { hasTypo, suggestion } = checkEmailTypo(email);
      if (hasTypo && suggestion) {
        setEmailSuggestion(suggestion);
        setShowEmailSuggestion(true);
        setEmailValidated(false);
      } else {
        setEmailSuggestion(null);
        setShowEmailSuggestion(false);
        setEmailValidated(true);
      }
    },
    []
  );

  // Debounced phone validation
  const debouncedPhoneValidation = useCallback(
    async (phone: string) => {
      if (!phone) {
        setPhoneValidated(false);
        return;
      }

      const normalized = normalizePhoneNumber(phone);
      setPhoneValidated(!!normalized);
    },
    []
  );

  // Handle email change with validation
  const handleEmailChange = (email: string) => {
    setSignUpData(prev => ({ ...prev, email }));
    setValidationErrors([]);
    
    const timeoutId = setTimeout(() => {
      debouncedEmailValidation(email);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle phone change with validation
  const handlePhoneChange = (phone: string) => {
    setSignUpData(prev => ({ ...prev, phone }));
    setValidationErrors([]);
    
    const timeoutId = setTimeout(() => {
      debouncedPhoneValidation(phone);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Accept email suggestion
  const acceptEmailSuggestion = () => {
    if (emailSuggestion) {
      setSignUpData(prev => ({ ...prev, email: emailSuggestion }));
      setEmailSuggestion(null);
      setShowEmailSuggestion(false);
      setEmailValidated(true);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    if (!signUpData.email || !signUpData.password || !signUpData.fullName || !signUpData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (signUpData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Validate for duplicate accounts
    const validation = await validateSignupData(signUpData.email, signUpData.phone);
    
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      setIsLoading(false);
      
      // If there's an email suggestion, show it
      if (validation.emailSuggestion) {
        setEmailSuggestion(validation.emailSuggestion);
        setShowEmailSuggestion(true);
      }
      
      return;
    }

    // Normalize phone number before signup
    const normalizedPhone = normalizePhoneNumber(signUpData.phone);
    
    const { error } = await signUp(signUpData.email, signUpData.password, signUpData.fullName, normalizedPhone, selectedPlan);
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

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
                {validationErrors.length > 0 && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="font-medium text-destructive">Account Already Exists</span>
                    </div>
                    <ul className="space-y-1 text-sm text-destructive">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setDefaultTab("signin")}
                        className="text-xs"
                      >
                        Sign In Instead
                      </Button>
                    </div>
                  </div>
                )}

                <AlertDialog open={showEmailSuggestion} onOpenChange={setShowEmailSuggestion}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Did you mean a different email?</AlertDialogTitle>
                      <AlertDialogDescription>
                        We noticed you entered <strong>{signUpData.email}</strong>. 
                        Did you mean <strong>{emailSuggestion}</strong> instead?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-2">
                      <AlertDialogCancel onClick={() => setShowEmailSuggestion(false)}>
                        Keep Original
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={acceptEmailSuggestion}>
                        Use Suggestion
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>

                <form onSubmit={handleSignUp} className="space-y-4">
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
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      Email
                      {emailValidated && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpData.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      disabled={isLoading}
                      className={emailValidated ? "border-green-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="flex items-center gap-2">
                      Phone Number
                      {phoneValidated && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="Enter your phone number (e.g., 01XXXXXXXXX)"
                      value={signUpData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      disabled={isLoading}
                      required
                      className={phoneValidated ? "border-green-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: 01XXXXXXXXX, +8801XXXXXXXXX
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
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