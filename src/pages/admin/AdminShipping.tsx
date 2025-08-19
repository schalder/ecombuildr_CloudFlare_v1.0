import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePlatformShipping } from '@/hooks/usePlatformShipping';
import { useToast } from '@/hooks/use-toast';

type Account = {
  id?: string;
  provider: string;
  api_key: string;
  secret_key: string;
  is_active: boolean;
  settings?: { webhook_token?: string };
};

export default function AdminShipping() {
  const { accounts, loading, updateAccount } = usePlatformShipping({ enabled: true });
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<Account>({
    provider: 'steadfast',
    api_key: '',
    secret_key: '',
    is_active: false,
    settings: { webhook_token: '' },
  });

  const customWebhookUrl = typeof window !== "undefined" ? `${window.location.origin}/steadfast-webhook` : "/steadfast-webhook";
  
  useEffect(() => {
    const steadfastAccount = accounts.find(acc => acc.provider === 'steadfast');
    if (steadfastAccount) {
      setAccount({
        id: steadfastAccount.id,
        provider: steadfastAccount.provider,
        api_key: steadfastAccount.api_key || '',
        secret_key: steadfastAccount.secret_key || '',
        is_active: !!steadfastAccount.is_active,
        settings: steadfastAccount.settings || { webhook_token: '' },
      });
    }
  }, [accounts]);

  const generateToken = () => {
    try {
      const arr = new Uint8Array(24);
      window.crypto.getRandomValues(arr);
      const token = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
      setAccount((a) => ({ ...a, settings: { ...(a.settings || {}), webhook_token: token } }));
      toast({ title: "Token generated", description: "A secure webhook token was created." });
    } catch (e) {
      console.error("Failed to generate token", e);
      toast({ title: "Error", description: "Could not generate token.", variant: "destructive" });
    }
  };

  const onSave = async () => {
    setSaving(true);
    
    if (!account.api_key || !account.secret_key) {
      toast({
        title: "Missing fields",
        description: "Please provide both API Key and Secret Key.",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    if (account.is_active && !account.settings?.webhook_token) {
      toast({
        title: "Webhook token required",
        description: "Please generate or enter a webhook token when enabling the integration.",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    try {
      await updateAccount('steadfast', {
        api_key: account.api_key,
        secret_key: account.secret_key,
        webhook_token: account.settings?.webhook_token || null,
        is_active: account.is_active,
        settings: {
          ...(account.settings || {}),
          webhook_token: account.settings?.webhook_token || null,
        },
      });

      toast({ title: "Saved", description: "Steadfast platform credentials updated." });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save credentials.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Platform Shipping Integration</h1>
            <p className="text-muted-foreground">
              Manage platform-wide shipping provider credentials for library products
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Steadfast Courier</h4>
                <div className="flex items-center gap-2">
                  <Label htmlFor="steadfast_enabled" className="text-sm text-muted-foreground">
                    Enabled
                  </Label>
                  <Switch
                    id="steadfast_enabled"
                    checked={account.is_active}
                    onCheckedChange={(is_active) => setAccount((a) => ({ ...a, is_active }))}
                    disabled={loading || saving}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="steadfast_api_key">API Key</Label>
                  <Input
                    id="steadfast_api_key"
                    value={account.api_key}
                    onChange={(e) => setAccount((a) => ({ ...a, api_key: e.target.value }))}
                    placeholder="Enter Steadfast API Key"
                    disabled={loading || saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="steadfast_secret_key">Secret Key</Label>
                  <Input
                    id="steadfast_secret_key"
                    type="password"
                    value={account.secret_key}
                    onChange={(e) => setAccount((a) => ({ ...a, secret_key: e.target.value }))}
                    placeholder="Enter Steadfast Secret Key"
                    disabled={loading || saving}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="steadfast_webhook_token">Webhook Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="steadfast_webhook_token"
                      value={account.settings?.webhook_token || ""}
                      onChange={(e) =>
                        setAccount((a) => ({
                          ...a,
                          settings: { ...(a.settings || {}), webhook_token: e.target.value },
                        }))
                      }
                      placeholder="Enter a secret token to verify webhooks"
                      disabled={loading || saving}
                    />
                    <Button type="button" variant="outline" onClick={generateToken}>Generate</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(account.settings?.webhook_token || "")}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Use this as the Bearer token in Steadfast webhook settings.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="steadfast_webhook_url_custom">Callback URL (Custom domain)</Label>
                    <div className="flex gap-2">
                      <Input id="steadfast_webhook_url_custom" readOnly value={customWebhookUrl} />
                      <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(customWebhookUrl)}>Copy</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Set this URL in your Steadfast dashboard.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={onSave} disabled={loading || saving}>
                  {saving ? "Saving..." : "Save Steadfast Settings"}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Once enabled and saved, platform-wide orders for library products will use these credentials automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}