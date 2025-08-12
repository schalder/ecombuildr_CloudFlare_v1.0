import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Store, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  theme_id?: string;
  is_active: boolean;
  settings: any;
}

export default function StoreSettings() {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStore();
    }
  }, [user]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      
      const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user?.id)
        .single();

      if (error) throw error;
      setStore(stores);
    } catch (error) {
      console.error('Error fetching store:', error);
      toast({
        title: "Error",
        description: "Failed to load store settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('stores')
        .update({
          name: store.name,
          description: store.description,
          domain: store.domain,
          primary_color: store.primary_color,
          secondary_color: store.secondary_color,
          is_active: store.is_active,
          settings: store.settings,
        })
        .eq('id', store.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Store settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating store:', error);
      toast({
        title: "Error",
        description: "Failed to update store settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Store Settings" description="Manage your store configuration">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-10 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!store) {
    return (
      <DashboardLayout title="Store Settings" description="Manage your store configuration">
        <Card>
          <CardContent className="text-center py-8">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No store found</h3>
            <p className="text-muted-foreground">Please create a store first</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Store Settings" 
      description="Manage your store configuration and branding"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Gateways Only */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Payment Gateway Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* bKash */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">bKash</h4>
                <div className="flex items-center gap-2">
                  <Label htmlFor="bkash_enabled" className="text-sm text-muted-foreground">Enabled</Label>
                  <Switch
                    id="bkash_enabled"
                    checked={!!store.settings?.bkash?.enabled}
                    onCheckedChange={(enabled) => setStore({
                      ...store,
                      settings: {
                        ...store.settings,
                        bkash: { mode: 'api', ...(store.settings?.bkash || {}), enabled }
                      }
                    })}
                  />
                </div>
              </div>

              {store.settings?.bkash?.enabled && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Mode</Label>
                      <Select
                        value={store.settings?.bkash?.mode || 'api'}
                        onValueChange={(mode) => setStore({
                          ...store,
                          settings: {
                            ...store.settings,
                            bkash: { ...(store.settings?.bkash || {}), mode }
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="number">Number only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {store.settings?.bkash?.mode === 'number' ? (
                    <div className="space-y-2">
                      <Label htmlFor="bkash_number">bKash Number</Label>
                      <Input
                        id="bkash_number"
                        value={store.settings?.bkash?.number || ''}
                        onChange={(e) => setStore({
                          ...store,
                          settings: {
                            ...store.settings,
                            bkash: { ...(store.settings?.bkash || {}), number: e.target.value }
                          }
                        })}
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="bkash_app_key">App Key</Label>
                        <Input
                          id="bkash_app_key"
                          value={store.settings?.bkash?.app_key || ''}
                          onChange={(e) => setStore({
                            ...store,
                            settings: {
                              ...store.settings,
                              bkash: { ...(store.settings?.bkash || {}), app_key: e.target.value }
                            }
                          })}
                          placeholder="bKash App Key"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bkash_app_secret">App Secret</Label>
                        <Input
                          id="bkash_app_secret"
                          type="password"
                          value={store.settings?.bkash?.app_secret || ''}
                          onChange={(e) => setStore({
                            ...store,
                            settings: {
                              ...store.settings,
                              bkash: { ...(store.settings?.bkash || {}), app_secret: e.target.value }
                            }
                          })}
                          placeholder="bKash App Secret"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bkash_username">Username</Label>
                        <Input
                          id="bkash_username"
                          value={store.settings?.bkash?.username || ''}
                          onChange={(e) => setStore({
                            ...store,
                            settings: {
                              ...store.settings,
                              bkash: { ...(store.settings?.bkash || {}), username: e.target.value }
                            }
                          })}
                          placeholder="bKash Username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bkash_password">Password</Label>
                        <Input
                          id="bkash_password"
                          type="password"
                          value={store.settings?.bkash?.password || ''}
                          onChange={(e) => setStore({
                            ...store,
                            settings: {
                              ...store.settings,
                              bkash: { ...(store.settings?.bkash || {}), password: e.target.value }
                            }
                          })}
                          placeholder="bKash Password"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Nagad */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Nagad</h4>
                <div className="flex items-center gap-2">
                  <Label htmlFor="nagad_enabled" className="text-sm text-muted-foreground">Enabled</Label>
                  <Switch
                    id="nagad_enabled"
                    checked={!!store.settings?.nagad?.enabled}
                    onCheckedChange={(enabled) => setStore({
                      ...store,
                      settings: {
                        ...store.settings,
                        nagad: { mode: 'api', ...(store.settings?.nagad || {}), enabled }
                      }
                    })}
                  />
                </div>
              </div>

              {store.settings?.nagad?.enabled && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Mode</Label>
                      <Select
                        value={store.settings?.nagad?.mode || 'api'}
                        onValueChange={(mode) => setStore({
                          ...store,
                          settings: {
                            ...store.settings,
                            nagad: { ...(store.settings?.nagad || {}), mode }
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="number">Number only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {store.settings?.nagad?.mode === 'number' ? (
                    <div className="space-y-2">
                      <Label htmlFor="nagad_number">Nagad Number</Label>
                      <Input
                        id="nagad_number"
                        value={store.settings?.nagad?.number || ''}
                        onChange={(e) => setStore({
                          ...store,
                          settings: {
                            ...store.settings,
                            nagad: { ...(store.settings?.nagad || {}), number: e.target.value }
                          }
                        })}
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nagad_merchant_id">Merchant ID</Label>
                        <Input
                          id="nagad_merchant_id"
                          value={store.settings?.nagad?.merchant_id || ''}
                          onChange={(e) => setStore({
                            ...store,
                            settings: {
                              ...store.settings,
                              nagad: { ...(store.settings?.nagad || {}), merchant_id: e.target.value }
                            }
                          })}
                          placeholder="Nagad Merchant ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nagad_public_key">Public Key</Label>
                        <Input
                          id="nagad_public_key"
                          value={store.settings?.nagad?.public_key || ''}
                          onChange={(e) => setStore({
                            ...store,
                            settings: {
                              ...store.settings,
                              nagad: { ...(store.settings?.nagad || {}), public_key: e.target.value }
                            }
                          })}
                          placeholder="Nagad Public Key"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nagad_private_key">Private Key</Label>
                        <Input
                          id="nagad_private_key"
                          type="password"
                          value={store.settings?.nagad?.private_key || ''}
                          onChange={(e) => setStore({
                            ...store,
                            settings: {
                              ...store.settings,
                              nagad: { ...(store.settings?.nagad || {}), private_key: e.target.value }
                            }
                          })}
                          placeholder="Nagad Private Key"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* SSLCommerz */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">SSLCommerz</h4>
                <div className="flex items-center gap-2">
                  <Label htmlFor="ssl_enabled" className="text-sm text-muted-foreground">Enabled</Label>
                  <Switch
                    id="ssl_enabled"
                    checked={!!store.settings?.sslcommerz?.enabled}
                    onCheckedChange={(enabled) => setStore({
                      ...store,
                      settings: {
                        ...store.settings,
                        sslcommerz: { ...(store.settings?.sslcommerz || {}), enabled }
                      }
                    })}
                  />
                </div>
              </div>

              {store.settings?.sslcommerz?.enabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sslcommerz_store_id">Store ID</Label>
                    <Input
                      id="sslcommerz_store_id"
                      value={store.settings?.sslcommerz?.store_id || ''}
                      onChange={(e) => setStore({
                        ...store,
                        settings: {
                          ...store.settings,
                          sslcommerz: { ...(store.settings?.sslcommerz || {}), store_id: e.target.value }
                        }
                      })}
                      placeholder="SSLCommerz Store ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sslcommerz_store_password">Store Password</Label>
                    <Input
                      id="sslcommerz_store_password"
                      type="password"
                      value={store.settings?.sslcommerz?.store_password || ''}
                      onChange={(e) => setStore({
                        ...store,
                        settings: {
                          ...store.settings,
                          sslcommerz: { ...(store.settings?.sslcommerz || {}), store_password: e.target.value }
                        }
                      })}
                      placeholder="SSLCommerz Store Password"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}