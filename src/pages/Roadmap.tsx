import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MapPin, Clock, CheckCircle, Circle, Loader } from "lucide-react";

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'shipped' | 'backlog';
  priority: number;
  target_date: string | null;
  created_at: string;
}

interface ChangelogEntry {
  id: string;
  title: string;
  content: string;
  version: string | null;
  published_at: string;
  created_at: string;
}

interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  status: 'new' | 'under_review' | 'planned' | 'rejected' | 'implemented';
  admin_response: string | null;
  created_at: string;
}

const feedbackSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

const statusConfig = {
  planned: { label: "Planned", icon: Circle, color: "bg-blue-500" },
  in_progress: { label: "In Progress", icon: Loader, color: "bg-yellow-500" },
  shipped: { label: "Shipped", icon: CheckCircle, color: "bg-green-500" },
  backlog: { label: "Backlog", icon: Circle, color: "bg-gray-500" },
};

const feedbackStatusConfig = {
  new: { label: "New", color: "bg-blue-500" },
  under_review: { label: "Under Review", color: "bg-yellow-500" },
  planned: { label: "Planned", color: "bg-purple-500" },
  rejected: { label: "Rejected", color: "bg-red-500" },
  implemented: { label: "Implemented", color: "bg-green-500" },
};

const Roadmap = () => {
  const { user } = useAuth();
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([]);
  const [userFeedback, setUserFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    fetchRoadmapData();
    if (user) {
      fetchUserFeedback();
    }
  }, [user]);

  const fetchRoadmapData = async () => {
    try {
      const [roadmapResponse, changelogResponse] = await Promise.all([
        supabase
          .from('platform_roadmap_items')
          .select('*')
          .eq('is_published', true)
          .order('priority', { ascending: false }),
        supabase
          .from('platform_changelog_entries')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false })
      ]);

      if (roadmapResponse.data) setRoadmapItems(roadmapResponse.data);
      if (changelogResponse.data) setChangelogEntries(changelogResponse.data);
    } catch (error) {
      console.error('Error fetching roadmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFeedback = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('platform_feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setUserFeedback(data);
    } catch (error) {
      console.error('Error fetching user feedback:', error);
    }
  };

  const onSubmitFeedback = async (values: z.infer<typeof feedbackSchema>) => {
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('platform_feedback')
        .insert({
          user_id: user.id,
          title: values.title,
          description: values.description,
        });

      if (error) throw error;

      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback! We'll review it soon.",
      });

      form.reset();
      fetchUserFeedback();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const groupedRoadmapItems = roadmapItems.reduce((acc, item) => {
    if (!acc[item.status]) acc[item.status] = [];
    acc[item.status].push(item);
    return acc;
  }, {} as Record<string, RoadmapItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Roadmap - EcomBuildr</title>
        <meta name="description" content="See what's coming next for EcomBuildr and share your feedback" />
      </Helmet>

      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">EcomBuildr Roadmap</h1>
          <p className="text-xl text-muted-foreground">
            See what we're building next and share your feedback
          </p>
        </div>

        <Tabs defaultValue="roadmap" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="changelog">Changelog</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="roadmap" className="space-y-8">
            {Object.entries(statusConfig).map(([status, config]) => {
              const items = groupedRoadmapItems[status] || [];
              if (items.length === 0) return null;

              return (
                <div key={status} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <h2 className="text-2xl font-semibold">{config.label}</h2>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <Card key={item.id}>
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            <config.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {item.description && (
                            <CardDescription className="mb-3">
                              {item.description}
                            </CardDescription>
                          )}
                          {item.target_date && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              Target: {format(new Date(item.target_date), 'MMM yyyy')}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="changelog" className="space-y-6">
            {changelogEntries.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No changelog entries yet.</p>
                </CardContent>
              </Card>
            ) : (
              changelogEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        {entry.title}
                        {entry.version && (
                          <Badge variant="outline">{entry.version}</Badge>
                        )}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(entry.published_at || entry.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: entry.content }}
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            {user ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Submit Feedback</CardTitle>
                    <CardDescription>
                      Have a feature request or found a bug? Let us know!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitFeedback)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Brief summary of your feedback" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide more details about your feedback"
                                  rows={4}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Submitting..." : "Submit Feedback"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {userFeedback.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Feedback</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {userFeedback.map((feedback) => (
                        <div key={feedback.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{feedback.title}</h4>
                            <Badge 
                              variant="secondary" 
                              className={feedbackStatusConfig[feedback.status].color + " text-white"}
                            >
                              {feedbackStatusConfig[feedback.status].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {feedback.description}
                          </p>
                          {feedback.admin_response && (
                            <div className="mt-3 p-3 bg-muted rounded">
                              <p className="text-sm font-medium mb-1">Admin Response:</p>
                              <p className="text-sm">{feedback.admin_response}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Submitted {format(new Date(feedback.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    Please sign in to submit feedback and see your previous submissions.
                  </p>
                  <Button asChild>
                    <a href="/auth">Sign In</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Roadmap;