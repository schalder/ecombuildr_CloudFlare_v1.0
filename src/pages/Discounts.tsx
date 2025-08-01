import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Percent, Plus, Tag, Calendar, MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimum_amount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  starts_at?: string;
  expires_at?: string;
  created_at: string;
}

export default function Discounts() {
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minimum_amount: '',
    usage_limit: '',
    starts_at: '',
    expires_at: '',
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      fetchDiscounts();
    }
  }, [user]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (stores && stores.length > 0) {
        // Using any type temporarily until database types are regenerated
        const { data: discounts, error } = await (supabase as any)
          .from('discount_codes')
          .select('*')
          .in('store_id', stores.map(store => store.id))
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDiscounts(discounts || []);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
      toast({
        title: "Error",
        description: "Failed to load discount codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (!stores || stores.length === 0) {
        toast({
          title: "Error",
          description: "No store found",
          variant: "destructive",
        });
        return;
      }

      const discountData = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        minimum_amount: formData.minimum_amount ? parseFloat(formData.minimum_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        starts_at: formData.starts_at || null,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
        store_id: stores[0].id,
        used_count: 0,
      };

      if (editingDiscount) {
        const { error } = await (supabase as any)
          .from('discount_codes')
          .update(discountData)
          .eq('id', editingDiscount.id);

        if (error) throw error;
        toast({ title: "Success", description: "Discount code updated successfully!" });
      } else {
        const { error } = await (supabase as any)
          .from('discount_codes')
          .insert(discountData);

        if (error) throw error;
        toast({ title: "Success", description: "Discount code created successfully!" });
      }

      resetForm();
      fetchDiscounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save discount code",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      minimum_amount: '',
      usage_limit: '',
      starts_at: '',
      expires_at: '',
      is_active: true,
    });
    setIsCreateOpen(false);
    setEditingDiscount(null);
  };

  const handleEdit = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value.toString(),
      minimum_amount: discount.minimum_amount?.toString() || '',
      usage_limit: discount.usage_limit?.toString() || '',
      starts_at: discount.starts_at?.split('T')[0] || '',
      expires_at: discount.expires_at?.split('T')[0] || '',
      is_active: discount.is_active,
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;

    try {
      const { error } = await (supabase as any)
        .from('discount_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Success", description: "Discount code deleted successfully!" });
      fetchDiscounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete discount code",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `Discount code "${code}" copied to clipboard` });
  };

  const activeDiscounts = discounts.filter(d => d.is_active);
  const totalUses = discounts.reduce((sum, d) => sum + d.used_count, 0);
  const totalSavings = discounts.reduce((sum, d) => {
    if (d.type === 'percentage') return sum; // Would need order data to calculate actual savings
    return sum + (d.value * d.used_count);
  }, 0);

  return (
    <DashboardLayout title="Discounts & Coupons" description="Create and manage discount codes and promotional offers">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{activeDiscounts.length} active discounts</Badge>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Create Discount
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingDiscount ? 'Edit' : 'Create'} Discount Code</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Discount Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., SAVE20"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">Value *</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={formData.type === 'percentage' ? '20' : '100'}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minimum_amount">Min. Amount</Label>
                    <Input
                      id="minimum_amount"
                      type="number"
                      step="0.01"
                      value={formData.minimum_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimum_amount: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usage_limit">Usage Limit</Label>
                    <Input
                      id="usage_limit"
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="starts_at">Start Date</Label>
                    <Input
                      id="starts_at"
                      type="date"
                      value={formData.starts_at}
                      onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires_at">End Date</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingDiscount ? 'Update' : 'Create'} Discount
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Total Uses</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{totalUses}</p>
              <p className="text-sm text-muted-foreground">Discount code uses</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Percent className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Total Savings</h3>
              </div>
              <p className="text-2xl font-bold mt-2">৳{totalSavings.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Customer savings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Active Codes</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{activeDiscounts.length}</p>
              <p className="text-sm text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Discount Codes ({discounts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : discounts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-2">No discount codes yet</h3>
                <p className="mb-4">Create discount codes to boost sales and reward customers.</p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Discount
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm">{discount.code}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(discount.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                      </TableCell>
                      <TableCell>
                        {discount.type === 'percentage' ? `${discount.value}%` : `৳${discount.value}`}
                      </TableCell>
                      <TableCell>
                        {discount.used_count}
                        {discount.usage_limit && ` / ${discount.usage_limit}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={discount.is_active ? "default" : "secondary"}>
                          {discount.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {discount.expires_at ? new Date(discount.expires_at).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(discount)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(discount.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}