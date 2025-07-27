import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Store, 
  Plus, 
  BarChart3, 
  Package, 
  Users, 
  Settings,
  LogOut,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface Store {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  is_active: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  subscription_plan: string;
  subscription_expires_at: string | null;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [createStoreData, setCreateStoreData] = useState({ name: '', slug: '' });
  const [isCreating, setIsCreating] = useState(false);

  // Redirect if not authenticated
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStores();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information.",
        variant: "destructive",
      });
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        title: "Error",
        description: "Failed to load stores.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createStoreData.name || !createStoreData.slug) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          owner_id: user?.id,
          name: createStoreData.name,
          slug: createStoreData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        })
        .select()
        .single();

      if (error) throw error;

      setStores([data, ...stores]);
      setShowCreateStore(false);
      setCreateStoreData({ name: '', slug: '' });
      
      toast({
        title: "Store created!",
        description: `Your store "${data.name}" has been created successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create store.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {profile?.full_name || user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs">
                {profile?.subscription_plan || 'free'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stores.length}</div>
              <p className="text-xs text-muted-foreground">
                Active stores in your account
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Orders across all stores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳0</div>
              <p className="text-xs text-muted-foreground">
                Revenue this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Total customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stores Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Stores</CardTitle>
                <CardDescription>
                  Manage your F-Commerce stores
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateStore(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Store
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showCreateStore && (
              <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                <h3 className="text-lg font-semibold mb-4">Create New Store</h3>
                <form onSubmit={createStore} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="store-name">Store Name</Label>
                      <Input
                        id="store-name"
                        type="text"
                        placeholder="My Awesome Store"
                        value={createStoreData.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setCreateStoreData({ 
                            name, 
                            slug: generateSlug(name) 
                          });
                        }}
                        disabled={isCreating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store-slug">Store URL (Slug)</Label>
                      <Input
                        id="store-slug"
                        type="text"
                        placeholder="my-awesome-store"
                        value={createStoreData.slug}
                        onChange={(e) => setCreateStoreData({ 
                          ...createStoreData, 
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                        })}
                        disabled={isCreating}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={isCreating}>
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Store
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateStore(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {stores.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No stores yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first F-Commerce store to get started.
                </p>
                <Button onClick={() => setShowCreateStore(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Store
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {stores.map((store) => (
                  <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{store.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {store.domain || `${store.slug}.fcommerce.app`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={store.is_active ? "default" : "secondary"}>
                        {store.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;