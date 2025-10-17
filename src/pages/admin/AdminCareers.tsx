import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface CareerOpening {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description_html: string;
  requirements_html: string | null;
  apply_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface CareerFormData {
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description_html: string;
  requirements_html: string;
  apply_url: string;
  is_published: boolean;
}

const AdminCareers = () => {
  const [careers, setCareers] = useState<CareerOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<CareerOpening | null>(null);
  const [formData, setFormData] = useState<CareerFormData>({
    title: '',
    department: '',
    location: '',
    employment_type: 'full-time',
    description_html: '',
    requirements_html: '',
    apply_url: '',
    is_published: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    try {
      const { data, error } = await supabase
        .from('career_openings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCareers(data || []);
    } catch (error) {
      console.error('Error fetching careers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch career openings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      department: '',
      location: '',
      employment_type: 'full-time',
      description_html: '',
      requirements_html: '',
      apply_url: '',
      is_published: false
    });
    setEditingCareer(null);
  };

  const handleEdit = (career: CareerOpening) => {
    setEditingCareer(career);
    setFormData({
      title: career.title,
      department: career.department || '',
      location: career.location || '',
      employment_type: career.employment_type || 'full-time',
      description_html: career.description_html,
      requirements_html: career.requirements_html || '',
      apply_url: career.apply_url || '',
      is_published: career.is_published
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCareer) {
        const { error } = await supabase
          .from('career_openings')
          .update({
            title: formData.title,
            department: formData.department || null,
            location: formData.location || null,
            employment_type: formData.employment_type,
            description_html: formData.description_html,
            requirements_html: formData.requirements_html || null,
            apply_url: formData.apply_url || null,
            is_published: formData.is_published
          })
          .eq('id', editingCareer.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Career opening updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('career_openings')
          .insert({
            title: formData.title,
            department: formData.department || null,
            location: formData.location || null,
            employment_type: formData.employment_type,
            description_html: formData.description_html,
            requirements_html: formData.requirements_html || null,
            apply_url: formData.apply_url || null,
            is_published: formData.is_published
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Career opening created successfully"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCareers();
    } catch (error) {
      console.error('Error saving career:', error);
      toast({
        title: "Error",
        description: "Failed to save career opening",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this career opening?')) return;

    try {
      const { error } = await supabase
        .from('career_openings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Career opening deleted successfully"
      });
      
      fetchCareers();
    } catch (error) {
      console.error('Error deleting career:', error);
      toast({
        title: "Error",
        description: "Failed to delete career opening",
        variant: "destructive"
      });
    }
  };

  const getEmploymentTypeColor = (type: string | null) => {
    switch (type) {
      case 'full-time': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'part-time': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'contract': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'internship': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout 
      title="Career Management" 
      description="Manage job openings and career opportunities"
    >
      <div className="space-y-6">
        <div className="flex justify-end items-center">
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Career Opening
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCareer ? 'Edit Career Opening' : 'Add Career Opening'}
              </DialogTitle>
              <DialogDescription>
                {editingCareer ? 'Update the career opening details' : 'Create a new career opening'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Engineering, Marketing"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Remote, New York, Hybrid"
                  />
                </div>
                
                <div>
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select 
                    value={formData.employment_type} 
                    onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="apply_url">Application URL</Label>
                <Input
                  id="apply_url"
                  type="url"
                  value={formData.apply_url}
                  onChange={(e) => setFormData({ ...formData, apply_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="description">Job Description *</Label>
                <RichTextEditor
                  value={formData.description_html}
                  onChange={(content) => setFormData({ ...formData, description_html: content })}
                  placeholder="Enter job description..."
                />
              </div>

              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <RichTextEditor
                  value={formData.requirements_html}
                  onChange={(content) => setFormData({ ...formData, requirements_html: content })}
                  placeholder="Enter job requirements..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">Publish this opening</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCareer ? 'Update' : 'Create'} Opening
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading career openings...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {careers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No career openings yet</h3>
                <p className="text-muted-foreground mb-4">Create your first job posting to get started.</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Career Opening
                </Button>
              </CardContent>
            </Card>
          ) : (
            careers.map((career) => (
              <Card key={career.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        {career.title}
                        <Badge variant={career.is_published ? "default" : "secondary"}>
                          {career.is_published ? "Published" : "Draft"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        {career.department && (
                          <span>{career.department}</span>
                        )}
                        {career.employment_type && (
                          <Badge 
                            variant="outline" 
                            className={getEmploymentTypeColor(career.employment_type)}
                          >
                            {career.employment_type.replace('-', ' ')}
                          </Badge>
                        )}
                        {career.location && (
                          <span className="text-sm">{career.location}</span>
                        )}
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {formatDate(career.created_at)}
                        </span>
                      </CardDescription>
                    </div>
                    
                    <div className="flex gap-2">
                      {career.is_published && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/careers/${career.id}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEdit(career)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(career.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ 
                      __html: career.description_html.substring(0, 300) + '...' 
                    }}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default AdminCareers;