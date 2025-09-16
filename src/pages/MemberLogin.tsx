import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock } from 'lucide-react';
import { useMemberAuth } from '@/hooks/useMemberAuth';
import { supabase } from '@/integrations/supabase/client';

interface Store {
  id: string;
  name: string;
  settings: any;
}

const MemberLogin = () => {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { member, signIn, loading: authLoading } = useMemberAuth();
  
  const [store, setStore] = useState<Store | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (member && store) {
      navigate(`/members/${storeSlug}/dashboard`);
    }
  }, [member, store, storeSlug, navigate]);

  // Fetch store data
  useEffect(() => {
    const fetchStore = async () => {
      if (!storeSlug) return;

      const { data, error } = await supabase
        .from('stores')
        .select('id, name, settings')
        .eq('slug', storeSlug)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        navigate('/404');
        return;
      }

      setStore(data);
    };

    fetchStore();
  }, [storeSlug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    setLoading(true);
    setError('');

    const result = await signIn(email, password, store.id);
    
    if (result.error) {
      setError(result.error);
    } else {
      navigate(`/members/${storeSlug}/dashboard`);
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <p className="text-muted-foreground">Members Area</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your purchased content
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              <p>Don't have access? Purchase a membership to get started.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberLogin;