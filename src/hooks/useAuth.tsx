import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
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
  const lastToastTime = useRef<number>(0);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted || abortController.signal.aborted) return;
        
        const previousSession = session;
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only show toasts for actual user actions, not session refreshes
        const now = Date.now();
        const timeSinceLastToast = now - lastToastTime.current;
        
        if (event === 'SIGNED_IN' && !isInitialLoad && timeSinceLastToast > 5000) {
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
          toast({
            title: "Signed out",
            description: "You have been signed out successfully.",
          });
          lastToastTime.current = now;
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
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
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

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || email.split('@')[0],
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};