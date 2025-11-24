
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Users, Mail, Phone, MapPin, RefreshCw, Calendar, Eye, EyeOff, TrendingUp, DollarSign, AlertCircle, MessageCircle, Trash2, MoreHorizontal, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { openWhatsApp } from "@/lib/utils";
import { normalizePhoneNumber } from "@/utils/authValidation";
import { Checkbox as UICheckbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Customer {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  city?: string;
  area?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
  last_order_date?: string;
}

export default function Customers() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 15;
  const isMobile = useIsMobile();
  const [blurSensitiveData, setBlurSensitiveData] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [customerFilter, setCustomerFilter] = useState<"all" | "one-time" | "repeat" | "vip">("all");
  const [lastOrderDates, setLastOrderDates] = useState<Record<string, string>>({});
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedCustomerIds(new Set());
  }, [activeTab]);

  useEffect(() => {
    const search = searchParams.get("search");
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // First get user's stores
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (storesError) throw storesError;

      if (stores && stores.length > 0) {
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select(`
            id,
            full_name,
            email,
            phone,
            city,
            area,
            total_orders,
            total_spent,
            created_at
          `)
          .in('store_id', stores.map(store => store.id))
          .order('total_spent', { ascending: false });

        if (customersError) throw customersError;
        setCustomers(customers || []);
        
        console.log('Fetched customers:', customers?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    await fetchCustomerOrderDetails();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Customer data has been refreshed",
    });
  };

  const fetchCustomerOrderDetails = async () => {
    try {
      if (customers.length === 0) return;

      // Get all store IDs
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (storesError) throw storesError;

      if (stores && stores.length > 0) {
        const customerIds = customers.map(c => c.id);
        
        // Fetch last order date for each customer
        // Exclude incomplete orders (pending_payment status) from last order date calculation
        const { data: orderDates, error: orderError } = await supabase
          .from('orders')
          .select('customer_id, created_at')
          .in('store_id', stores.map(store => store.id))
          .in('customer_id', customerIds)
          .neq('status', 'pending_payment' as any) // Exclude incomplete orders
          .order('created_at', { ascending: false });

        if (orderError) throw orderError;

        // Group by customer_id and get the latest order date
        const lastOrderMap: Record<string, string> = {};
        orderDates?.forEach(order => {
          if (!lastOrderMap[order.customer_id]) {
            lastOrderMap[order.customer_id] = order.created_at;
          }
        });

        setLastOrderDates(lastOrderMap);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  useEffect(() => {
    if (customers.length > 0 && user) {
      fetchCustomerOrderDetails();
    }
  }, [customers]);

  // Filter customers: only show those with completed purchases (total_orders > 0)
  // Exclude customers who only have incomplete/failed/cancelled orders
  const filteredCustomers = customers
    .filter(c => c.total_orders > 0) // Only customers with completed purchases
    .filter(customer =>
    customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const endIndex = startIndex + customersPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [customerFilter]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Filter out customers with only incomplete orders (total_orders = 0) for statistics
  const activeCustomers = customers.filter(c => c.total_orders > 0);

  const customerStats = {
    total: activeCustomers.length,
    totalSpent: activeCustomers.reduce((sum, customer) => sum + customer.total_spent, 0),
    averageOrderValue: activeCustomers.length > 0 
      ? activeCustomers.reduce((sum, customer) => sum + customer.total_spent, 0) / activeCustomers.reduce((sum, customer) => sum + customer.total_orders, 0)
      : 0,
  };

  // Calculate VIP customers (top 10% by spend or 5+ orders)
  // Only consider customers with completed orders
  const sortedBySpend = [...activeCustomers].sort((a, b) => b.total_spent - a.total_spent);
  const vipThreshold = sortedBySpend.length > 0 ? sortedBySpend[Math.floor(sortedBySpend.length * 0.9)]?.total_spent || 0 : 0;
  const vipCustomers = activeCustomers.filter(c => c.total_orders >= 5 || c.total_spent >= vipThreshold);

  // Repeat customers metrics
  // Only consider customers with completed orders
  const repeatCustomers = activeCustomers.filter(c => c.total_orders >= 2);
  const oneTimeCustomers = activeCustomers.filter(c => c.total_orders === 1);
  const repeatCustomerRate = activeCustomers.length > 0 ? (repeatCustomers.length / activeCustomers.length * 100).toFixed(1) : '0';
  
  // Revenue from repeat customers in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentRepeatRevenue = repeatCustomers.reduce((sum, customer) => {
    const lastOrderDate = lastOrderDates[customer.id];
    if (lastOrderDate && new Date(lastOrderDate) >= thirtyDaysAgo) {
      return sum + customer.total_spent;
    }
    return sum;
  }, 0);

  // Lost potential revenue (15% of one-time customers would buy again at avg order value)
  const lostPotentialRevenue = oneTimeCustomers.length * 0.15 * customerStats.averageOrderValue;

  // Filter customers based on selected filter
  // Exclude customers with only incomplete orders (total_orders = 0) from main list
  const getFilteredCustomers = () => {
    // Filter out customers with only incomplete orders (total_orders = 0)
    // These customers only have pending_payment orders and shouldn't appear in the main list
    let filtered = customers.filter(c => c.total_orders > 0);
    
    if (customerFilter === "one-time") {
      filtered = filtered.filter(c => c.total_orders === 1);
    } else if (customerFilter === "repeat") {
      filtered = filtered.filter(c => c.total_orders >= 2);
    } else if (customerFilter === "vip") {
      filtered = vipCustomers;
    }

    return filtered.filter(customer =>
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
    );
  };

  const filteredCustomersByTab = getFilteredCustomers();
  const totalPagesFiltered = Math.ceil(filteredCustomersByTab.length / customersPerPage);
  const startIndexFiltered = (currentPage - 1) * customersPerPage;
  const endIndexFiltered = startIndexFiltered + customersPerPage;
  const paginatedFilteredCustomers = filteredCustomersByTab.slice(startIndexFiltered, endIndexFiltered);

  // Bulk selection helpers
  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  const selectAllCustomers = () => {
    const currentCustomers = activeTab === 'all' ? paginatedCustomers : paginatedFilteredCustomers;
    if (selectedCustomerIds.size === currentCustomers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(currentCustomers.map(c => c.id)));
    }
  };

  const clearSelection = () => {
    setSelectedCustomerIds(new Set());
  };

  const currentCustomersForSelection = activeTab === 'all' ? paginatedCustomers : paginatedFilteredCustomers;
  const isAllSelected = currentCustomersForSelection.length > 0 && selectedCustomerIds.size === currentCustomersForSelection.length;
  const isSomeSelected = selectedCustomerIds.size > 0 && selectedCustomerIds.size < currentCustomersForSelection.length;

  // Delete customer function
  const deleteCustomer = async (customerId: string) => {
    try {
      // First, delete customer_addresses if they exist
      const { error: addressesError } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('customer_id', customerId);

      if (addressesError) {
        console.error('Error deleting customer addresses:', addressesError);
        // Continue even if addresses deletion fails (might not exist)
      }

      // Delete the customer (orders will have customer_id set to NULL due to ON DELETE SET NULL)
      const { error: customerError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (customerError) throw customerError;

      // Remove from local state
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      setSelectedCustomerIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(customerId);
        return newSet;
      });

      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    }
  };

  // Bulk delete customers
  const bulkDeleteCustomers = async () => {
    if (selectedCustomerIds.size === 0) return;

    const customerIds = Array.from(selectedCustomerIds);
    setIsDeleting(true);
    setDeleteProgress({ current: 0, total: customerIds.length });

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < customerIds.length; i++) {
        const customerId = customerIds[i];
        setDeleteProgress({ current: i + 1, total: customerIds.length });

        try {
          // Delete customer_addresses first
          await supabase
            .from('customer_addresses')
            .delete()
            .eq('customer_id', customerId);

          // Delete the customer
          const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', customerId);

          if (error) throw error;

          setCustomers(prev => prev.filter(c => c.id !== customerId));
          successCount++;
        } catch (error: any) {
          failCount++;
          const customer = customers.find(c => c.id === customerId);
          errors.push(`Customer ${customer?.full_name || customerId}: ${error.message || 'Failed to delete'}`);
          console.error(`Error deleting customer ${customerId}:`, error);
        }
      }

      // Show summary toast
      if (successCount > 0 && failCount === 0) {
        toast({
          title: "Success",
          description: `Successfully deleted ${successCount} customer${successCount > 1 ? 's' : ''}`,
        });
        clearSelection();
      } else if (successCount > 0 && failCount > 0) {
        toast({
          title: "Partial Success",
          description: `Deleted ${successCount} customer${successCount > 1 ? 's' : ''}. ${failCount} failed.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to delete ${failCount} customer${failCount > 1 ? 's' : ''}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(false);
      setDeleteProgress(null);
    }
  };

  return (
    <DashboardLayout 
      title="Customers" 
      description="Manage your customer relationships and view analytics"
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="all">All Customers</TabsTrigger>
            <TabsTrigger value="repeat">Repeat Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary mr-3" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{customerStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">৳{customerStats.totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
                  <p className="text-2xl font-bold">
                    ৳{isNaN(customerStats.averageOrderValue) ? 0 : customerStats.averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 text-foreground ${isMobile ? 'w-full' : 'w-80'}`}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {blurSensitiveData ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch 
                checked={blurSensitiveData} 
                onCheckedChange={setBlurSensitiveData}
            />
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className={isMobile ? 'w-full justify-center' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          </div>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customers ({filteredCustomers.length})
              {totalPages > 1 && (
                <span className="text-sm font-normal text-muted-foreground">
                  • Page {currentPage} of {totalPages}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Bulk Action Toolbar */}
            {selectedCustomerIds.size > 0 && !loading && (
              <div className="flex items-center justify-between p-4 bg-primary/5 border rounded-lg mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedCustomerIds.size} customer{selectedCustomerIds.size > 1 ? 's' : ''} selected
                  </span>
                  {deleteProgress && (
                    <span className="text-sm text-muted-foreground">
                      Deleting {deleteProgress.current} of {deleteProgress.total}...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Delete ${selectedCustomerIds.size} customer${selectedCustomerIds.size > 1 ? 's' : ''} permanently? This cannot be undone. Orders will be preserved but customer information will be removed.`)) {
                        bulkDeleteCustomers();
                      }
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Customer{selectedCustomerIds.size > 1 ? 's' : ''}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearSelection}
                    disabled={isDeleting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : paginatedCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">
                  {customers.length === 0 ? 'No customers yet' : 'No customers found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {customers.length === 0 
                    ? 'Customers will automatically appear here when they place orders' 
                    : 'Try adjusting your search terms'
                  }
                </p>
                {customers.length === 0 && (
                  <Button onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Check for new customers
                  </Button>
                )}
              </div>
            ) : isMobile ? (
              // Mobile Card View
              <div className="space-y-4">
                {/* Select All for Mobile */}
                {paginatedCustomers.length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <UICheckbox
                      checked={isAllSelected}
                      onCheckedChange={selectAllCustomers}
                      disabled={isDeleting}
                    />
                    <label className="text-sm font-medium cursor-pointer" onClick={selectAllCustomers}>
                      Select All
                    </label>
                  </div>
                )}
                {paginatedCustomers.map((customer) => (
                  <Card key={customer.id} className="p-4">
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <UICheckbox
                            checked={selectedCustomerIds.has(customer.id)}
                            onCheckedChange={() => toggleCustomerSelection(customer.id)}
                            disabled={isDeleting}
                            className="mt-1"
                          />
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {customer.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate" style={{ filter: blurSensitiveData ? 'blur(4px)' : 'none' }}>
                              {customer.full_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {customer.total_orders} order{customer.total_orders !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="font-semibold">৳{customer.total_spent.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Total</div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setCustomerToDelete(customer);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Customer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate" style={{ filter: blurSensitiveData ? 'blur(4px)' : 'none' }}>
                              {customer.email}
                            </span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span style={{ filter: blurSensitiveData ? 'blur(4px)' : 'none' }}>
                              {customer.phone}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const normalizedPhone = normalizePhoneNumber(customer.phone);
                                openWhatsApp(normalizedPhone);
                              }}
                              className="text-green-600 hover:text-green-700 transition-colors ml-1"
                              title="Open WhatsApp chat"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        {(customer.city || customer.area) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {[customer.area, customer.city].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          First order: {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              // Desktop Table View
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <UICheckbox
                        checked={isAllSelected}
                        onCheckedChange={selectAllCustomers}
                        disabled={isDeleting}
                      />
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead className="hidden md:table-cell">First Order</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <UICheckbox
                          checked={selectedCustomerIds.has(customer.id)}
                          onCheckedChange={() => toggleCustomerSelection(customer.id)}
                          disabled={isDeleting}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {customer.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium" style={{ filter: blurSensitiveData ? 'blur(4px)' : 'none' }}>
                              {customer.full_name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <span style={{ filter: blurSensitiveData ? 'blur(4px)' : 'none' }}>
                              {customer.email}
                              </span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              <span style={{ filter: blurSensitiveData ? 'blur(4px)' : 'none' }}>
                              {customer.phone}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const normalizedPhone = normalizePhoneNumber(customer.phone);
                                  openWhatsApp(normalizedPhone);
                                }}
                                className="text-green-600 hover:text-green-700 transition-colors ml-1"
                                title="Open WhatsApp chat"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {customer.city || customer.area ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {[customer.area, customer.city].filter(Boolean).join(', ')}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer.total_orders}
                      </TableCell>
                      <TableCell className="font-medium">
                        ৳{customer.total_spent.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 w-9 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setCustomerToDelete(customer);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={handlePreviousPage}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={handleNextPage}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="repeat" className="space-y-6">
            {/* Header with Search and Blur Toggle */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 text-foreground ${isMobile ? 'w-full' : 'w-80'}`}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {blurSensitiveData ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch 
                    checked={blurSensitiveData} 
                    onCheckedChange={setBlurSensitiveData}
                  />
                </div>
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className={isMobile ? 'w-full justify-center' : ''}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Repeat Customers Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-primary mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Repeat Customer Rate</p>
                      <p className="text-2xl font-bold">{repeatCustomerRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-primary mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenue (Last 30 Days)</p>
                      <p className="text-2xl font-bold">৳{recentRepeatRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-8 w-8 text-primary mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lost Potential</p>
                      <p className="text-2xl font-bold">৳{lostPotentialRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={customerFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCustomerFilter("all")}
              >
                All ({customers.filter(c => 
                  c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.phone?.includes(searchTerm)
                ).length})
              </Button>
              <Button
                variant={customerFilter === "one-time" ? "default" : "outline"}
                size="sm"
                onClick={() => setCustomerFilter("one-time")}
              >
                One-Time ({oneTimeCustomers.length})
              </Button>
              <Button
                variant={customerFilter === "repeat" ? "default" : "outline"}
                size="sm"
                onClick={() => setCustomerFilter("repeat")}
              >
                Repeat ({repeatCustomers.length})
              </Button>
              <Button
                variant={customerFilter === "vip" ? "default" : "outline"}
                size="sm"
                onClick={() => setCustomerFilter("vip")}
              >
                VIP ({vipCustomers.length})
              </Button>
            </div>

            {/* Repeat Customers Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customers ({filteredCustomersByTab.length})
                  {totalPagesFiltered > 1 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      • Page {currentPage} of {totalPagesFiltered}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Bulk Action Toolbar */}
                {selectedCustomerIds.size > 0 && !loading && (
                  <div className="flex items-center justify-between p-4 bg-primary/5 border rounded-lg mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        {selectedCustomerIds.size} customer{selectedCustomerIds.size > 1 ? 's' : ''} selected
                      </span>
                      {deleteProgress && (
                        <span className="text-sm text-muted-foreground">
                          Deleting {deleteProgress.current} of {deleteProgress.total}...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`Delete ${selectedCustomerIds.size} customer${selectedCustomerIds.size > 1 ? 's' : ''} permanently? This cannot be undone. Orders will be preserved but customer information will be removed.`)) {
                            bulkDeleteCustomers();
                          }
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Customer{selectedCustomerIds.size > 1 ? 's' : ''}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearSelection}
                        disabled={isDeleting}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                )}
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : paginatedFilteredCustomers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No customers found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                ) : isMobile ? (
                  // Mobile Card View
                  <div className="space-y-4">
                    {/* Select All for Mobile */}
                    {paginatedFilteredCustomers.length > 0 && (
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <UICheckbox
                          checked={isAllSelected}
                          onCheckedChange={selectAllCustomers}
                          disabled={isDeleting}
                        />
                        <label className="text-sm font-medium cursor-pointer" onClick={selectAllCustomers}>
                          Select All
                        </label>
                      </div>
                    )}
                    {paginatedFilteredCustomers.map((customer) => (
                      <Card key={customer.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <UICheckbox
                                checked={selectedCustomerIds.has(customer.id)}
                                onCheckedChange={() => toggleCustomerSelection(customer.id)}
                                disabled={isDeleting}
                                className="mt-1"
                              />
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium text-primary">
                                  {customer.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-sm truncate" style={{ filter: blurSensitiveData ? 'blur(4px)' : 'none' }}>
                                  {customer.full_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {customer.total_orders} order{customer.total_orders !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="text-right">
                                <div className="font-semibold">৳{customer.total_spent.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">Total</div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setCustomerToDelete(customer);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Customer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-2">
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate" style={{ filter: blurSensitiveData ? 'blur(4px)' : 'none' }}>
                                  {customer.email}
                                </span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span style={{ filter: blurSensitiveData ? 'blur(4px)' : 'none' }}>
                                  {customer.phone}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const normalizedPhone = normalizePhoneNumber(customer.phone);
                                    openWhatsApp(normalizedPhone);
                                  }}
                                  className="text-green-600 hover:text-green-700 transition-colors ml-1"
                                  title="Open WhatsApp chat"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                            {(customer.city || customer.area) && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {[customer.area, customer.city].filter(Boolean).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Footer Info */}
                          <div className="space-y-2 text-sm pt-2 border-t">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>First Order:</span>
                              <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                            </div>
                            {lastOrderDates[customer.id] && (
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Last Order:</span>
                                <span>{new Date(lastOrderDates[customer.id]).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  // Desktop Table View
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <UICheckbox
                            checked={isAllSelected}
                            onCheckedChange={selectAllCustomers}
                            disabled={isDeleting}
                          />
                        </TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="hidden md:table-cell">Contact</TableHead>
                        <TableHead className="hidden lg:table-cell">Location</TableHead>
                        <TableHead>First Order</TableHead>
                        <TableHead>Last Order</TableHead>
                        <TableHead>Total Orders</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedFilteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <UICheckbox
                              checked={selectedCustomerIds.has(customer.id)}
                              onCheckedChange={() => toggleCustomerSelection(customer.id)}
                              disabled={isDeleting}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {customer.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="font-medium" style={{ filter: blurSensitiveData ? 'blur(4px)' : 'none' }}>
                                {customer.full_name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="space-y-1">
                              {customer.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  <span style={{ filter: blurSensitiveData ? 'blur(4px)' : 'none' }}>
                                    {customer.email}
                                  </span>
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  <span style={{ filter: blurSensitiveData ? 'blur(4px)' : 'none' }}>
                                    {customer.phone}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const normalizedPhone = normalizePhoneNumber(customer.phone);
                                      openWhatsApp(normalizedPhone);
                                    }}
                                    className="text-green-600 hover:text-green-700 transition-colors ml-1"
                                    title="Open WhatsApp chat"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {customer.city || customer.area ? (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3" />
                                {[customer.area, customer.city].filter(Boolean).join(', ')}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(customer.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {lastOrderDates[customer.id] 
                              ? new Date(lastOrderDates[customer.id]).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {customer.total_orders}
                          </TableCell>
                          <TableCell className="font-medium">
                            ৳{customer.total_spent.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 w-9 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setCustomerToDelete(customer);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Customer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Pagination */}
                {totalPagesFiltered > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPagesFiltered }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesFiltered))}
                            className={currentPage === totalPagesFiltered ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{customerToDelete?.full_name}</strong>? This action cannot be undone.
                <br />
                <br />
                Orders associated with this customer will be preserved, but the customer information will be permanently removed from the database.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (customerToDelete) {
                    await deleteCustomer(customerToDelete.id);
                    setDeleteDialogOpen(false);
                    setCustomerToDelete(null);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
