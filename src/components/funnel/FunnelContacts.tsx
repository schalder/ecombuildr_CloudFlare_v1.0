import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Mail, 
  Phone, 
  User, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  CheckSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FormSubmission {
  id: string;
  store_id: string;
  form_type: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  message: string | null;
  product_id: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  form_name: string | null;
  form_id: string | null;
  funnel_id: string | null;
  custom_fields: Record<string, any> | null;
}

interface FunnelContactsProps {
  funnelId: string;
}

export const FunnelContacts: React.FC<FunnelContactsProps> = ({ funnelId }) => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formFilter, setFormFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [formNames, setFormNames] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set<string>());
  const [isDeleting, setIsDeleting] = useState(false);

  // Load form submissions
  useEffect(() => {
    loadSubmissions();
  }, [funnelId]);

  // Filter submissions when search or filters change
  useEffect(() => {
    let filtered = submissions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(submission => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (submission.form_name?.toLowerCase().includes(searchLower)) ||
          (submission.customer_name?.toLowerCase().includes(searchLower)) ||
          (submission.customer_email?.toLowerCase().includes(searchLower)) ||
          (submission.customer_phone?.toLowerCase().includes(searchLower)) ||
          (submission.custom_fields && Object.values(submission.custom_fields).some(value => 
            String(value).toLowerCase().includes(searchLower)
          ))
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }

    // Form filter
    if (formFilter !== 'all') {
      filtered = filtered.filter(submission => submission.form_name === formFilter);
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchTerm, statusFilter, formFilter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('form_submissions')
        .select('*')
        .eq('funnel_id', funnelId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const submissionsData = data || [];
      setSubmissions(submissionsData);
      
      // Extract unique form names
      const uniqueFormNames = [...new Set(submissionsData.map((s: any) => s.form_name).filter(Boolean))];
      setFormNames(uniqueFormNames as string[]);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (submissionId: string, newStatus: FormSubmission['status']) => {
    try {
      const { error } = await supabase
        .from('form_submissions')
        .update({ status: newStatus })
        .eq('id', submissionId);

      if (error) throw error;

      // Update local state
      setSubmissions(prev => 
        prev.map(submission => 
          submission.id === submissionId 
            ? { ...submission, status: newStatus }
            : submission
        )
      );

      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Delete single contact
  const deleteSingleContact = async (submissionId: string) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('form_submissions')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;

      // Update local state
      setSubmissions(prev => prev.filter(submission => submission.id !== submissionId));
      setSelectedContacts(prev => {
        const newSet = new Set<string>(prev);
        newSet.delete(submissionId);
        return newSet;
      });

      toast.success('Contact deleted successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete multiple contacts
  const deleteBulkContacts = async () => {
    if (selectedContacts.size === 0) return;

    try {
      setIsDeleting(true);
      const contactIds = Array.from(selectedContacts);
      
      const { error } = await supabase
        .from('form_submissions')
        .delete()
        .in('id', contactIds);

      if (error) throw error;

      // Update local state
      setSubmissions(prev => prev.filter(submission => !selectedContacts.has(submission.id)));
      setSelectedContacts(new Set<string>());

      toast.success(`${contactIds.length} contact${contactIds.length > 1 ? 's' : ''} deleted successfully`);
    } catch (error) {
      console.error('Error deleting contacts:', error);
      toast.error('Failed to delete contacts');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle checkbox selection
  const handleSelectContact = (submissionId: string, checked: boolean) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(submissionId);
      } else {
        newSet.delete(submissionId);
      }
      return newSet;
    });
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set<string>(filteredSubmissions.map(submission => submission.id));
      setSelectedContacts(allIds);
    } else {
      setSelectedContacts(new Set<string>());
    }
  };

  const exportToCSV = () => {
    if (!filteredSubmissions || filteredSubmissions.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const headers = ['Date', 'Form Name', 'Customer Name', 'Email', 'Phone', 'Status', ...Object.keys(filteredSubmissions[0]?.custom_fields || {})];
    const csvContent = [
      headers.join(','),
      ...filteredSubmissions.map(submission => [
        new Date(submission.created_at).toLocaleDateString(),
        submission.form_name || '',
        submission.customer_name || '',
        submission.customer_email || '',
        submission.customer_phone || '',
        submission.status || '',
        ...Object.values(submission.custom_fields || {}).map(value => `"${String(value).replace(/"/g, '""')}"`)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funnel-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: FormSubmission['status']) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'read':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'replied':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: FormSubmission['status']) => {
    const variants = {
      new: 'default',
      read: 'secondary',
      replied: 'default',
      closed: 'outline'
    } as const;

    const colors = {
      new: 'bg-blue-100 text-blue-800',
      read: 'bg-yellow-100 text-yellow-800',
      replied: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contacts</h2>
          <p className="text-muted-foreground">
            {filteredSubmissions.length} contact{filteredSubmissions.length !== 1 ? 's' : ''} found
            {selectedContacts.size > 0 && (
              <span className="ml-2 text-primary font-medium">
                • {selectedContacts.size} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedContacts.size > 0 && (
            <Button 
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${selectedContacts.size} contact${selectedContacts.size > 1 ? 's' : ''}? This action cannot be undone.`)) {
                  deleteBulkContacts();
                }
              }}
              variant="destructive"
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedContacts.size})
            </Button>
          )}
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Form</Label>
              <Select value={formFilter} onValueChange={setFormFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {formNames.map(formName => (
                    <SelectItem key={formName} value={formName}>
                      {formName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setFormFilter('all');
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredSubmissions.length > 0 && selectedContacts.size === filteredSubmissions.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all contacts"
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filteredSubmissions || []).map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedContacts.has(submission.id)}
                      onCheckedChange={(checked) => handleSelectContact(submission.id, checked as boolean)}
                      aria-label={`Select contact ${submission.customer_name || submission.customer_email}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(submission.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{submission.form_name || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {submission.customer_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {submission.customer_name}
                        </div>
                      )}
                      {submission.customer_email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {submission.customer_email}
                        </div>
                      )}
                      {submission.customer_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {submission.customer_phone}
                        </div>
                      )}
                      {!submission.customer_name && !submission.customer_email && !submission.customer_phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3 text-muted-foreground" />
                          No contact info available
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(submission.status)}
                      {getStatusBadge(submission.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Contact Details</DialogTitle>
                          </DialogHeader>
                          {selectedSubmission && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Form Name</Label>
                                  <p className="text-sm">{selectedSubmission.form_name}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Submitted</Label>
                                  <p className="text-sm">
                                    {new Date(selectedSubmission.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div>
                                <Label className="text-sm font-medium">Form Data</Label>
                                <div className="mt-2 space-y-2">
                                  {Object.entries(selectedSubmission.custom_fields).map(([key, value]) => {
                                    // Helper function to get proper field label
                                    const getFieldLabel = (fieldKey: string): string => {
                                      // If it's already a proper label (not field-1, field-2, etc.), return as is
                                      if (!fieldKey.match(/^field-\d+$/i)) {
                                        return fieldKey.replace(/([A-Z])/g, ' $1').trim();
                                      }
                                      
                                      // Map old field IDs to common field labels based on typical form structure
                                      const fieldMapping: Record<string, string> = {
                                        'field-1': 'Full Name',
                                        'field-2': 'Phone Number', 
                                        'field-3': 'Email Address',
                                        'field-4': 'Address',
                                        'field-5': 'Message',
                                        'field-6': 'Company',
                                        'field-7': 'Website',
                                        'field-8': 'Subject'
                                      };
                                      
                                      return fieldMapping[fieldKey.toLowerCase()] || fieldKey;
                                    };

                                    return (
                                      <div key={key} className="flex justify-between py-2 border-b">
                                        <span className="font-medium capitalize">
                                          {getFieldLabel(key)}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {String(value)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div>
                                <Label className="text-sm font-medium">Status Actions</Label>
                                <div className="flex gap-2 mt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => updateSubmissionStatus(selectedSubmission.id, 'read')}
                                    disabled={selectedSubmission.status === 'read'}
                                  >
                                    Mark as Read
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => updateSubmissionStatus(selectedSubmission.id, 'replied')}
                                    disabled={selectedSubmission.status === 'replied'}
                                  >
                                    Mark as Replied
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => updateSubmissionStatus(selectedSubmission.id, 'closed')}
                                    disabled={selectedSubmission.status === 'closed'}
                                  >
                                    Close
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete this contact? This action cannot be undone.`)) {
                            deleteSingleContact(submission.id);
                          }
                        }}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredSubmissions.length === 0 && (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No contacts found</h3>
              <p className="text-muted-foreground">
                {submissions.length === 0 
                  ? 'No form submissions yet. Add forms to your funnel to start collecting contacts.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
