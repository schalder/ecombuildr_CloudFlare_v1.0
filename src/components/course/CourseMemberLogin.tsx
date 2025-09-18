import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock } from 'lucide-react';
import { useMemberAuth } from '@/hooks/useMemberAuth';
import { useStore } from '@/contexts/StoreContext';
import { MetaTags } from '@/components/MetaTags';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CourseMemberLogin = () => {
  const navigate = useNavigate();
  const { member, signIn, loading: authLoading } = useMemberAuth();
  const { store } = useStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch store settings for logo and favicon
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings', store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      
      const { data, error } = await supabase
        .from('stores')
        .select('course_login_logo_url, course_favicon_url')
        .eq('id', store.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  // Redirect if already logged in
  useEffect(() => {
    if (member && store) {
      navigate('/courses/members');
    }
  }, [member, store, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    setLoading(true);
    setError('');

    const result = await signIn(email, password, store.id);
    
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/courses/members');
    }
    
    setLoading(false);
  };

  if (authLoading || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <MetaTags
        title={`Course Members Login - ${store.name}`}
        description="Access your purchased courses"
        favicon={storeSettings?.course_favicon_url}
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {storeSettings?.course_login_logo_url ? (
              <div className="inline-flex items-center justify-center w-60 h-20 mb-2">
                <img 
                  src={storeSettings.course_login_logo_url} 
                  alt={`${store.name} Logo`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-2">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            )}
            <h1 className="text-2xl font-bold">Login Into the Members Area</h1>
          </div>

          <Card>
            <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Don't have access? Purchase a course to get started.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default CourseMemberLogin;