import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MessageSquare, User, Calendar } from "lucide-react";

interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  status: 'new' | 'under_review' | 'planned' | 'rejected' | 'implemented';
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

const responseSchema = z.object({
  status: z.enum(['new', 'under_review', 'planned', 'rejected', 'implemented']),
  admin_response: z.string().optional(),
});

const statusOptions = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'under_review', label: 'Under Review', color: 'bg-yellow-500' },
  { value: 'planned', label: 'Planned', color: 'bg-purple-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  { value: 'implemented', label: 'Implemented', color: 'bg-green-500' },
];

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof responseSchema>>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      status: "new",
      admin_response: "",
    },
  });

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately if we have user_ids
      const userIds = data?.map(item => item.user_id).filter(Boolean) || [];
      let profiles: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        profiles = profilesData || [];
      }

      // Combine feedback with user profiles
      const feedbackWithProfiles = data?.map(item => ({
        ...item,
        profiles: profiles.find(profile => profile.id === item.user_id) || null
      })) || [];

      setFeedback(feedbackWithProfiles);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to fetch feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitResponse = async (values: z.infer<typeof responseSchema>) => {
    if (!selectedFeedback) return;

    try {
      const { error } = await supabase
        .from('platform_feedback')
        .update({
          status: values.status,
          admin_response: values.admin_response || null,
        })
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      toast({ title: "Success", description: "Feedback updated successfully" });
      setDialogOpen(false);
      setSelectedFeedback(null);
      form.reset();
      fetchFeedback();
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast({
        title: "Error",
        description: "Failed to update feedback",
        variant: "destructive",
      });
    }
  };

  const handleRespondToFeedback = (item: FeedbackItem) => {
    setSelectedFeedback(item);
    form.reset({
      status: item.status,
      admin_response: item.admin_response || "",
    });
    setDialogOpen(true);
  };

  const getStatusConfig = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const filterFeedbackByStatus = (status: string) => {
    return feedback.filter(item => item.status === status);
  };

  if (loading) {
    return (
      <AdminLayout title="Feedback Management" description="Manage user feedback">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Feedback Management" description="Manage user feedback">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">User Feedback</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            Total: {feedback.length}
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New ({filterFeedbackByStatus('new').length})</TabsTrigger>
            <TabsTrigger value="under_review">Under Review ({filterFeedbackByStatus('under_review').length})</TabsTrigger>
            <TabsTrigger value="planned">Planned ({filterFeedbackByStatus('planned').length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({filterFeedbackByStatus('rejected').length})</TabsTrigger>
            <TabsTrigger value="implemented">Implemented ({filterFeedbackByStatus('implemented').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <FeedbackList items={feedback} onRespond={handleRespondToFeedback} />
          </TabsContent>
          
          {statusOptions.map(({ value }) => (
            <TabsContent key={value} value={value}>
              <FeedbackList 
                items={filterFeedbackByStatus(value)} 
                onRespond={handleRespondToFeedback} 
              />
            </TabsContent>
          ))}
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Respond to Feedback</DialogTitle>
              <DialogDescription>
                Update the status and provide a response to the user
              </DialogDescription>
            </DialogHeader>
            
            {selectedFeedback && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">{selectedFeedback.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedFeedback.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {selectedFeedback.profiles?.full_name || selectedFeedback.profiles?.email || 'Unknown User'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(selectedFeedback.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitResponse)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="admin_response"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Response (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide feedback to the user about their suggestion..."
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Update Feedback
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

interface FeedbackListProps {
  items: FeedbackItem[];
  onRespond: (item: FeedbackItem) => void;
}

const FeedbackList = ({ items, onRespond }: FeedbackListProps) => {
  const getStatusConfig = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No feedback items found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const statusConfig = getStatusConfig(item.status);
        return (
          <Card key={item.id}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {item.profiles?.full_name || item.profiles?.email || 'Unknown User'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(item.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${statusConfig.color} text-white`}>
                    {statusConfig.label}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRespond(item)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Respond
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <CardDescription>{item.description}</CardDescription>
              {item.admin_response && (
                <div className="p-3 bg-muted rounded">
                  <p className="text-sm font-medium mb-1">Admin Response:</p>
                  <p className="text-sm">{item.admin_response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminFeedback;