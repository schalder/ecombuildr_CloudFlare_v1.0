import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { usePlatformShipping } from '@/hooks/usePlatformShipping';
import { useToast } from '@/hooks/use-toast';
import { Truck, Settings, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdminShipping() {
  const { accounts, loading, updateAccount, deleteAccount } = usePlatformShipping({ enabled: true });
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const [formData, setFormData] = useState({
    provider: '',
    api_key: '',
    secret_key: '',
    webhook_token: '',
    is_active: true,
    settings: {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateAccount(formData.provider, {
        api_key: formData.api_key,
        secret_key: formData.secret_key,
        webhook_token: formData.webhook_token || null,
        is_active: formData.is_active,
        settings: formData.settings,
      });

      toast({
        title: "Success",
        description: `${formData.provider} account ${editingAccount ? 'updated' : 'added'} successfully`,
      });

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save shipping account",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setFormData({
      provider: account.provider,
      api_key: account.api_key,
      secret_key: account.secret_key,
      webhook_token: account.webhook_token || '',
      is_active: account.is_active,
      settings: account.settings,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, provider: string) => {
    if (window.confirm(`Are you sure you want to delete the ${provider} account?`)) {
      try {
        await deleteAccount(id);
        toast({
          title: "Success",
          description: `${provider} account deleted successfully`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete shipping account",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setEditingAccount(null);
    setFormData({
      provider: '',
      api_key: '',
      secret_key: '',
      webhook_token: '',
      is_active: true,
      settings: {},
    });
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingAccount ? 'Edit' : 'Add'} Shipping Account
                  </DialogTitle>
                  <DialogDescription>
                    Configure shipping provider credentials for platform-wide use
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="provider" className="text-right">
                      Provider
                    </Label>
                    <Input
                      id="provider"
                      value={formData.provider}
                      onChange={(e) => setFormData({...formData, provider: e.target.value})}
                      className="col-span-3"
                      placeholder="e.g., steadfast"
                      disabled={!!editingAccount}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="api_key" className="text-right">
                      API Key
                    </Label>
                    <Input
                      id="api_key"
                      value={formData.api_key}
                      onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="secret_key" className="text-right">
                      Secret Key
                    </Label>
                    <Input
                      id="secret_key"
                      type="password"
                      value={formData.secret_key}
                      onChange={(e) => setFormData({...formData, secret_key: e.target.value})}
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="webhook_token" className="text-right">
                      Webhook Token
                    </Label>
                    <Input
                      id="webhook_token"
                      value={formData.webhook_token}
                      onChange={(e) => setFormData({...formData, webhook_token: e.target.value})}
                      className="col-span-3"
                      placeholder="Optional"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="is_active" className="text-right">
                      Active
                    </Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAccount ? 'Update' : 'Add'} Account
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Accounts
            </CardTitle>
            <CardDescription>
              Platform-wide shipping provider integrations for fulfilling library product orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading accounts...</div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No shipping accounts configured yet</p>
                <p className="text-sm">Add a shipping provider to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Truck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold capitalize">{account.provider}</h3>
                          <p className="text-sm text-muted-foreground">
                            API Key: {account.api_key.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={account.is_active ? "default" : "secondary"}>
                          {account.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(account)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(account.id, account.provider)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {account.webhook_token && (
                      <>
                        <Separator className="my-3" />
                        <div className="text-sm text-muted-foreground">
                          <strong>Webhook Token:</strong> {account.webhook_token.substring(0, 12)}...
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}