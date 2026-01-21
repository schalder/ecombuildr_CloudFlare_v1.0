import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName?: string, phone?: string, planName?: string | null) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const lastToastTime = useRef<number>(0);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted || abortController.signal.aborted) return;
        
        // ✅ SET SESSION FIRST (non-blocking)
        const previousSession = session;
        setSession(session);
        setUser(session?.user ?? null);
        
        // ✅ Check fake status in background (non-blocking)
        if (event === 'SIGNED_IN' && session?.user) {
          supabase
            .from('profiles')
            .select('account_status')
            .eq('id', session.user.id)
            .single()
            .then(({ data: profile, error }) => {
              if (!isMounted || abortController.signal.aborted) return;
              
              if (profile?.account_status === 'fake') {
                supabase.auth.signOut();
                toast({
                  title: "Access Denied",
                  description: "Your account has been marked as fake and cannot access the platform.",
                  variant: "destructive",
                });
                return;
              }
              
              // Ignore errors - don't block session restoration
              if (error && error.code !== 'PGRST116') {
                console.warn('Error checking fake status:', error);
              }
            })
            .catch((error) => {
              // Silently fail - don't block auth state change
              if (!abortController.signal.aborted) {
                console.warn('Error checking fake status:', error);
              }
            });
        }
        
        // Only show toasts for actual user actions, not session refreshes
        const now = Date.now();
        const timeSinceLastToast = now - lastToastTime.current;
        
        if (event === 'SIGNED_IN' && !isInitialLoad && timeSinceLastToast > 5000) {
          // Reset logging out state on successful sign-in
          setIsLoggingOut(false);
          
          // Only show welcome toast for genuine sign-ins, not tab switches or refreshes
          const isGenuineSignIn = !previousSession || previousSession.user?.id !== session?.user?.id;
          
          if (isGenuineSignIn) {
            toast({
              title: "Welcome back!",
              description: "You have been signed in successfully.",
            });
            lastToastTime.current = now;
          }
        } else if (event === 'SIGNED_OUT' && !isInitialLoad && timeSinceLastToast > 2000) {
          // Reset logging out state when signed out
          setIsLoggingOut(false);
          
          toast({
            title: "Signed out",
            description: "You have been signed out successfully.",
          });
          lastToastTime.current = now;
        }
        
        // Always reset logging out state on any auth state change
        if (event === 'SIGNED_IN') {
          setIsLoggingOut(false);
        }
        
        // Mark initial load as complete after first auth state change
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session with abort signal
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted || abortController.signal.aborted) return;
        
        // ✅ SET SESSION FIRST (non-blocking)
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Reset logging out state during initial session check
        setIsLoggingOut(false);
        
        // ✅ Check fake status in background (non-blocking, don't await)
        if (session?.user) {
          supabase
            .from('profiles')
            .select('account_status')
            .eq('id', session.user.id)
            .single()
            .then(({ data: profile, error }) => {
              // Only handle if component is still mounted
              if (!isMounted || abortController.signal.aborted) return;
              
              // If fake user, sign out (but session was already set, so dashboard can load)
              if (profile?.account_status === 'fake') {
                supabase.auth.signOut();
                setSession(null);
                setUser(null);
              }
              
              // Ignore errors - don't block session restoration
              if (error && error.code !== 'PGRST116') {
                console.warn('Error checking fake status:', error);
              }
            })
            .catch((error) => {
              // Silently fail - don't block session restoration
              if (!abortController.signal.aborted) {
                console.warn('Error checking fake status:', error);
              }
            });
        }
        
        // Set initial load to false after getting session
        setTimeout(() => {
          if (isMounted) {
            setIsInitialLoad(false);
          }
        }, 1000);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error getting initial session:', error);
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    getInitialSession();

    return () => {
      isMounted = false;
      abortController.abort();
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, phone?: string, planName?: string | null) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || email.split('@')[0],
            phone: phone || null,
            selected_plan: planName || 'starter'
          },
        },
      });

      if (!error) {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Check if user account is fake after successful auth
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_status')
          .eq('id', data.user.id)
          .single();

        if (profile?.account_status === 'fake') {
          // Sign out immediately
          await supabase.auth.signOut();
          return { 
            error: { 
              message: 'Your account has been marked as fake and cannot access the platform. Please contact support if you believe this is an error.' 
            } 
          };
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setIsLoggingOut(true);
      
      // Add fail-safe timeout to reset logging out state
      const timeoutId = setTimeout(() => {
        setIsLoggingOut(false);
      }, 5000); // Reset after 5 seconds if logout doesn't complete
      
      const { error } = await supabase.auth.signOut();
      
      // Clear timeout if logout completes normally
      clearTimeout(timeoutId);
      
      if (error) {
        setIsLoggingOut(false);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      }
      // Don't redirect here - let the auth state change handle it
    } catch (error) {
      setIsLoggingOut(false);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    isLoggingOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};