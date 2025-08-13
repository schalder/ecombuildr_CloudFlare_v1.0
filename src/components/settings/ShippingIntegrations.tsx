
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type Props = {
  storeId: string;
};

type Account = {
  id?: string;
  api_key: string;
  secret_key: string;
  is_active: boolean;
  settings?: { webhook_token?: string };
};

export default function ShippingIntegrations({ storeId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
const [account, setAccount] = useState<Account>({
  api_key: "",
  secret_key: "",
  is_active: false,
  settings: { webhook_token: "" },
});
  const [recordId, setRecordId] = useState<string | undefined>(undefined);
  
  const customWebhookUrl = typeof window !== "undefined" ? `${window.location.origin}/steadfast-webhook` : "/steadfast-webhook";
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
  useEffect(() => {
    let mounted = true;
    async function fetchAccount() {
      setLoading(true);
      console.log("[ShippingIntegrations] Fetching steadfast account for store:", storeId);
      const { data, error } = await supabase
        .from("store_shipping_accounts")
        .select("id, api_key, secret_key, is_active, settings")
        .eq("store_id", storeId)
        .eq("provider", "steadfast")
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("Error loading Steadfast account:", error);
      }
      if (data) {
        setRecordId(data.id);
        setAccount({
          api_key: data.api_key || "",
          secret_key: data.secret_key || "",
          is_active: !!data.is_active,
          settings: (data as any).settings || { webhook_token: "" },
        });
      }
      setLoading(false);
    }
    if (storeId) fetchAccount();
    return () => {
      mounted = false;
    };
  }, [storeId]);

  const onSave = async () => {
    setSaving(true);
    console.log("[ShippingIntegrations] Saving steadfast account", { recordId, storeId });
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

    if (recordId) {
      const { error } = await supabase
        .from("store_shipping_accounts")
        .update({
          api_key: account.api_key,
          secret_key: account.secret_key,
          is_active: account.is_active,
          settings: {
            ...(account.settings || {}),
            webhook_token: account.settings?.webhook_token || null,
          },
        })
        .eq("id", recordId);
      if (error) {
        console.error("Failed to update Steadfast credentials:", error);
        toast({
          title: "Error",
          description: "Failed to update credentials.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Saved", description: "Steadfast credentials updated." });
      }
    } else {
      const { data, error } = await supabase
        .from("store_shipping_accounts")
        .insert({
          store_id: storeId,
          provider: "steadfast",
          api_key: account.api_key,
          secret_key: account.secret_key,
          settings: { webhook_token: account.settings?.webhook_token || null },
          is_active: account.is_active,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Failed to save Steadfast credentials:", error);
        toast({
          title: "Error",
          description: "Failed to save credentials.",
          variant: "destructive",
        });
      } else {
        setRecordId(data.id);
        toast({ title: "Saved", description: "Steadfast credentials created." });
      }
    }
    setSaving(false);
  };

  return (
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
            Once enabled and saved, you’ll be able to push an order to Steadfast from your Orders list with one click.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
