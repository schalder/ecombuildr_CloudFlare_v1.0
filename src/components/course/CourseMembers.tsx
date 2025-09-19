import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Filter, MoreHorizontal, CheckCircle, Clock, XCircle, RotateCcw, Trash2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUserStore } from '@/hooks/useUserStore';

interface CourseOrder {
  id: string;
  course_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  metadata: any;
  course: {
    title: string;
  };
  course_member_access?: {
    access_status: string;
    member_account_id: string;
  }[];
}

export const CourseMembers = () => {
  const { store } = useUserStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  // Fetch course orders with member access data
  const { data: courseOrders = [], isLoading } = useQuery({
    queryKey: ['course-orders', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      
      const { data, error } = await supabase
        .from('course_orders')
        .select(`
          *,
          course:courses(title),
          course_member_access(access_status, member_account_id)
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CourseOrder[];
    },
    enabled: !!store?.id,
  });

  // Fetch courses for filter dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ['courses', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('store_id', store.id)
        .order('title');

      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  // Update member access status
  const updateAccessMutation = useMutation({
    mutationFn: async ({ orderId, accessStatus }: { orderId: string; accessStatus: string }) => {
      // 1) Fetch the course order to get store_id, course_id, and email
      const { data: order, error: orderError } = await supabase
        .from('course_orders')
        .select('id, store_id, course_id, customer_email')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!order) throw new Error('Order not found');

      // 2) Update course order payment status based on access status
      if (accessStatus === 'active') {
        await supabase.from('course_orders').update({ payment_status: 'completed' }).eq('id', orderId);
      } else if (accessStatus === 'suspended') {
        await supabase.from('course_orders').update({ payment_status: 'cancelled' }).eq('id', orderId);
      }

      // 3) Try to update existing course_member_access for this order
      const { data: updatedAccess, error: updateAccessError } = await supabase
        .from('course_member_access')
        .update({ access_status: accessStatus, is_active: accessStatus === 'active' })
        .eq('course_order_id', orderId)
        .select('id');

      if (updateAccessError) throw updateAccessError;

      // 4) If none updated (no existing link), attempt to create it
      if (!updatedAccess || updatedAccess.length === 0) {
        // Find member account by store and email
        const { data: member, error: memberError } = await supabase
          .from('member_accounts')
          .select('id')
          .eq('store_id', order.store_id)
          .eq('email', order.customer_email)
          .maybeSingle();

        if (memberError) throw memberError;
        if (!member?.id) {
          throw new Error('No member account found for this email. Please create a member account first.');
        }

        const { error: insertAccessError } = await supabase
          .from('course_member_access')
          .insert({
            member_account_id: member.id,
            course_id: order.course_id,
            course_order_id: orderId,
            access_status: accessStatus,
            is_active: accessStatus === 'active',
          });
        if (insertAccessError) throw insertAccessError;
      }

      // 5) Sync content access activation state for any related rows
      const { error: contentAccessToggleError } = await supabase
        .from('member_content_access')
        .update({ is_active: accessStatus === 'active' })
        .eq('course_order_id', orderId);
      if (contentAccessToggleError) throw contentAccessToggleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-orders', store?.id] });
      toast.success('Member access updated successfully');
    },
    onError: (error) => {
      console.error('Error updating member access:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update member access');
    },
  });

  // Delete course order and all related data
  const deleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      try {
        console.log('Starting deletion process for order:', orderId);

        // Step 1: Get member account IDs associated with this order
        const { data: memberAccessData, error: memberAccessError } = await supabase
          .from('course_member_access')
          .select('member_account_id')
          .eq('course_order_id', orderId);

        if (memberAccessError) {
          console.error('Error fetching member access data:', memberAccessError);
          throw new Error(`Failed to fetch member access data: ${memberAccessError.message}`);
        }

        const memberAccountIds = memberAccessData?.map(access => access.member_account_id).filter(Boolean) || [];
        console.log('Found member account IDs:', memberAccountIds);

        // Step 2: Delete member content access records
        const { error: contentAccessError } = await supabase
          .from('member_content_access')
          .delete()
          .eq('course_order_id', orderId);

        if (contentAccessError) {
          console.error('Error deleting member content access:', contentAccessError);
          throw new Error(`Failed to delete member content access: ${contentAccessError.message}`);
        }
        console.log('Deleted member content access records');

        // Step 3: Delete course member access records
        const { error: memberAccessDeleteError } = await supabase
          .from('course_member_access')
          .delete()
          .eq('course_order_id', orderId);

        if (memberAccessDeleteError) {
          console.error('Error deleting course member access:', memberAccessDeleteError);
          throw new Error(`Failed to delete course member access: ${memberAccessDeleteError.message}`);
        }
        console.log('Deleted course member access records');

        // Step 4: Delete member accounts if they exist
        if (memberAccountIds.length > 0) {
          const { error: memberAccountError } = await supabase
            .from('member_accounts')
            .delete()
            .in('id', memberAccountIds);

          if (memberAccountError) {
            console.error('Error deleting member accounts:', memberAccountError);
            throw new Error(`Failed to delete member accounts: ${memberAccountError.message}`);
          }
          console.log('Deleted member accounts');
        }

        // Step 5: Finally delete the course order
        const { error: orderDeleteError } = await supabase
          .from('course_orders')
          .delete()
          .eq('id', orderId);

        if (orderDeleteError) {
          console.error('Error deleting course order:', orderDeleteError);
          throw new Error(`Failed to delete course order: ${orderDeleteError.message}`);
        }
        console.log('Deleted course order');

        return { success: true };
      } catch (error) {
        console.error('Deletion process failed:', error);
        throw error;
      }
    },
    onSuccess: (_data, orderId) => {
      // Optimistically update cache for snappy UI
      queryClient.setQueryData<any[]>(['course-orders', store?.id], (old) => {
        if (!old) return old;
        return old.filter((o: any) => o.id !== orderId);
      });
      // Invalidate to ensure server state is in sync
      queryClient.invalidateQueries({ queryKey: ['course-orders', store?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-orders'] });
      toast.success('Student record deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting student record:', error);
      const errorMessage = error?.message || 'Failed to delete student record';
      toast.error(errorMessage);
    },
  });


  // Filter orders
  const filteredOrders = courseOrders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.course.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (order.course_member_access?.[0]?.access_status || 'pending') === statusFilter;

    const matchesCourse = courseFilter === 'all' || order.course_id === courseFilter;

    const matchesPaymentMethod = paymentMethodFilter === 'all' || 
      order.payment_method === paymentMethodFilter;

    return matchesSearch && matchesStatus && matchesCourse && matchesPaymentMethod;
  });

  const getStatusBadge = (order: CourseOrder) => {
    const accessStatus = order.course_member_access?.[0]?.access_status || 'pending';
    
    switch (accessStatus) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold">Course Members & Purchases</h2>
        <div className="text-sm text-muted-foreground">
          Total: {filteredOrders.length} purchases
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Access Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="eps">EPS</SelectItem>
                <SelectItem value="bkash">bKash</SelectItem>
                <SelectItem value="nagad">Nagad</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCourseFilter('all');
                setPaymentMethodFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Access Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading course purchases...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No course purchases found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                          {order.customer_phone && (
                            <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.course.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">৳{order.total}</div>
                          <div className="text-sm">{order.payment_method.toUpperCase()}</div>
                          {(order.metadata as any)?.transaction_id && (
                            <div className="text-xs text-muted-foreground">
                              TXN: {(order.metadata as any).transaction_id}
                            </div>
                          )}
                          {getPaymentStatusBadge(order.payment_status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(order.course_member_access?.[0]?.access_status || 'pending') === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => updateAccessMutation.mutate({ orderId: order.id, accessStatus: 'active' })}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Access
                              </DropdownMenuItem>
                            )}
                            
                            {(order.course_member_access?.[0]?.access_status || 'pending') === 'active' && (
                              <DropdownMenuItem
                                onClick={() => updateAccessMutation.mutate({ orderId: order.id, accessStatus: 'suspended' })}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Suspend Access
                              </DropdownMenuItem>
                            )}

                            {(order.course_member_access?.[0]?.access_status || 'pending') === 'suspended' && (
                              <DropdownMenuItem
                                onClick={() => updateAccessMutation.mutate({ orderId: order.id, accessStatus: 'active' })}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reactivate Access
                              </DropdownMenuItem>
                            )}


                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600"
                                 >
                                   <Trash2 className="h-4 w-4 mr-2" />
                                   Delete Student
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                   <AlertDialogTitle>Delete Student Record?</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     This will permanently delete {order.customer_name}'s enrollment record, course access, and account data. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(order.id)}
                                    disabled={deleteMutation.isPending}
                                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                  >
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Student'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};