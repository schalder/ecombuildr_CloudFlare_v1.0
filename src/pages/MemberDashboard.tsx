import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, Play, Download, BookOpen, User } from 'lucide-react';
import { useMemberAuth } from '@/hooks/useMemberAuth';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string;
  membership_content: {
    type: 'course' | 'download';
    content: Array<{
      id: string;
      title: string;
      type: 'video' | 'file' | 'text';
      url?: string;
      content?: string;
    }>;
  };
}

interface Store {
  id: string;
  name: string;
  settings: any;
}

const MemberDashboard = () => {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { member, signOut, loading: authLoading } = useMemberAuth();
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !member) {
      navigate(`/members/${storeSlug}/login`);
    }
  }, [member, authLoading, storeSlug, navigate]);

  // Fetch store and accessible content
  useEffect(() => {
    const fetchData = async () => {
      if (!member || !storeSlug) return;

      try {
        // Fetch store
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id, name, settings')
          .eq('slug', storeSlug)
          .eq('is_active', true)
          .single();

        if (storeError || !storeData) {
          navigate('/404');
          return;
        }

        setStore(storeData);

        // Fetch accessible products
        const { data, error } = await supabase
          .from('member_content_access')
          .select(`
            product:products (
              id,
              name,
              description,
              membership_content
            )
          `)
          .eq('member_account_id', member.id)
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching accessible content:', error);
          return;
        }

        const accessibleProducts = data
          ?.map(item => item.product)
          .filter(Boolean) as Product[];

        setProducts(accessibleProducts || []);
      } catch (error) {
        console.error('Error fetching member data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [member, storeSlug, navigate]);

  const handleSignOut = () => {
    signOut();
    navigate(`/members/${storeSlug}/login`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!member || !store) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{store.name}</h1>
              <p className="text-muted-foreground">Members Area</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm">{member.full_name || member.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Your Content</h2>
          <p className="text-muted-foreground">Access your purchased courses and downloads</p>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No content available</h3>
              <p className="text-muted-foreground text-center">
                You don't have access to any content yet. Purchase a membership to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                      <CardDescription className="line-clamp-3 mt-2">
                        {product.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {product.membership_content?.type === 'course' ? (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Course
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    {product.membership_content?.content?.map((item, index) => (
                      <div key={item.id || index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2">
                          {item.type === 'video' && <Play className="h-4 w-4 text-primary" />}
                          {item.type === 'file' && <Download className="h-4 w-4 text-primary" />}
                          {item.type === 'text' && <BookOpen className="h-4 w-4 text-primary" />}
                          <span className="text-sm font-medium">{item.title}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          {item.type === 'file' ? 'Download' : 'View'}
                        </Button>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground">No content items available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;