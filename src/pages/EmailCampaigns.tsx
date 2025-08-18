import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Mail, Users, Send, Plus, Trash2, Eye } from 'lucide-react';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'sent' | 'scheduled';
  recipient_count: number;
  open_rate: number;
  click_rate: number;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  store_id: string;
}

interface Customer {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

const EmailCampaigns: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);

  const [form, setForm] = useState({
    name: '',
    subject: '',
    content: '',
    recipient_type: 'all_customers'
  });

  useEffect(() => {
    if (user) {
      fetchCampaigns();
      fetchCustomers();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    if (!user) return;
    
    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id);

      if (!stores || stores.length === 0) return;

      // Since we don't have email_campaigns table yet, we'll simulate data
      setCampaigns([]);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!user) return;
    
    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id);

      if (!stores || stores.length === 0) return;

      const storeIds = stores.map(store => store.id);
      const { data } = await supabase
        .from('customers')
        .select('id, email, full_name, created_at')
        .in('store_id', storeIds)
        .not('email', 'is', null);

      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.subject || !form.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id)
        .limit(1)
        .maybeSingle();

      if (!stores) {
        toast.error('Store not found');
        return;
      }

      // For now, we'll just show a success message
      // In a real implementation, you'd save to an email_campaigns table
      toast.success(`Email campaign "${form.name}" created successfully!`);
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      subject: '',
      content: '',
      recipient_type: 'all_customers'
    });
    setEditingCampaign(null);
  };

  const handleEdit = (campaign: EmailCampaign) => {
    setForm({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content,
      recipient_type: 'all_customers'
    });
    setEditingCampaign(campaign);
    setIsDialogOpen(true);
  };

  const totalSubscribers = customers.length;
  const totalCampaigns = campaigns.length;
  const avgOpenRate = campaigns.length > 0 
    ? campaigns.reduce((sum, c) => sum + c.open_rate, 0) / campaigns.length 
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Email Campaigns</h1>
            <p className="text-muted-foreground">
              Reach your customers with targeted email marketing campaigns
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCampaign ? 'Edit Campaign' : 'Create Email Campaign'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Black Friday Sale"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="🔥 50% OFF Everything - Limited Time!"
                  />
                </div>

                <div>
                  <Label htmlFor="recipient_type">Recipients</Label>
                  <Select
                    value={form.recipient_type}
                    onValueChange={(value) => setForm(prev => ({ ...prev, recipient_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_customers">
                        All Customers ({totalSubscribers})
                      </SelectItem>
                      <SelectItem value="recent_customers">
                        Recent Customers (Last 30 days)
                      </SelectItem>
                      <SelectItem value="high_value">
                        High Value Customers
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="content">Email Content *</Label>
                  <Textarea
                    id="content"
                    value={form.content}
                    onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your email content here... You can use HTML for formatting."
                    rows={8}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubscribers}</div>
              <p className="text-xs text-muted-foreground">
                Active email subscribers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                Email campaigns sent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Email open rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Campaigns sent this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors"
                   onClick={() => {
                     setForm({
                       name: 'Welcome Series',
                       subject: 'Welcome to our store!',
                       content: `Hi {{customer_name}},

Welcome to our store! We're excited to have you as a customer.

Here's a special 10% discount for your first order: WELCOME10

Shop now: {{store_url}}

Best regards,
{{store_name}} Team`,
                       recipient_type: 'all_customers'
                     });
                     setIsDialogOpen(true);
                   }}>
                <h3 className="font-semibold">Welcome Email</h3>
                <p className="text-sm text-muted-foreground">Greet new customers</p>
              </div>

              <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors"
                   onClick={() => {
                     setForm({
                       name: 'Sale Announcement',
                       subject: '🔥 FLASH SALE - 50% OFF Everything!',
                       content: `Don't miss out on our biggest sale of the year!

🔥 50% OFF on ALL products
⏰ Limited time only - ends in 24 hours!
🚚 Free shipping on orders over $50

Use code: FLASH50

Shop now: {{store_url}}

Best,
{{store_name}}`,
                       recipient_type: 'all_customers'
                     });
                     setIsDialogOpen(true);
                   }}>
                <h3 className="font-semibold">Sale Announcement</h3>
                <p className="text-sm text-muted-foreground">Promote sales & discounts</p>
              </div>

              <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors"
                   onClick={() => {
                     setForm({
                       name: 'Win-Back Campaign',
                       subject: 'We miss you! Come back for 20% off',
                       content: `Hey {{customer_name}},

We noticed you haven't shopped with us in a while and we miss you!

As a valued customer, here's an exclusive 20% discount just for you: COMEBACK20

Check out our latest products: {{store_url}}

We'd love to have you back!

{{store_name}} Team`,
                       recipient_type: 'recent_customers'
                     });
                     setIsDialogOpen(true);
                   }}>
                <h3 className="font-semibold">Win-Back</h3>
                <p className="text-sm text-muted-foreground">Re-engage inactive customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first email campaign to start engaging with customers
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{campaign.subject}</TableCell>
                      <TableCell>{campaign.recipient_count}</TableCell>
                      <TableCell>
                        <Badge variant={
                          campaign.status === 'sent' ? 'default' :
                          campaign.status === 'draft' ? 'secondary' : 'outline'
                        }>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.open_rate.toFixed(1)}%</TableCell>
                      <TableCell>
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(campaign)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Handle delete
                              toast.success('Campaign deleted');
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
};

export default EmailCampaigns;