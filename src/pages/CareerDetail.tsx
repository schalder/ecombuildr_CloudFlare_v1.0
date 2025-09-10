import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Building, ExternalLink, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CareerOpening {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description_html: string;
  requirements_html: string | null;
  apply_url: string | null;
  created_at: string;
}

const CareerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [career, setCareer] = useState<CareerOpening | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCareer(id);
    }
  }, [id]);

  const fetchCareer = async (careerId: string) => {
    try {
      const { data, error } = await supabase
        .from('career_openings')
        .select('*')
        .eq('id', careerId)
        .eq('is_published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          throw error;
        }
        return;
      }

      setCareer(data);
    } catch (error) {
      console.error('Error fetching career:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getEmploymentTypeColor = (type: string | null) => {
    switch (type) {
      case 'full-time': return 'bg-green-100 text-green-800';
      case 'part-time': return 'bg-blue-100 text-blue-800';
      case 'contract': return 'bg-orange-100 text-orange-800';
      case 'internship': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading job details...</p>
      </main>
    );
  }

  if (notFound || !career) {
    return (
      <>
        <SEOHead 
          title="Job Not Found - Ecomflex Careers"
          description="The job posting you're looking for could not be found."
        />
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-6">Job Not Found</h1>
              <p className="text-xl text-muted-foreground mb-8">
                The job posting you're looking for could not be found or is no longer available.
              </p>
              <Button asChild>
                <Link to="/careers">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Careers
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title={`${career.title} - Ecomflex Careers`}
        description={`Join our team as a ${career.title}. ${career.description_html.replace(/<[^>]*>/g, '').substring(0, 150)}...`}
        keywords={["job", career.title, "careers", "ecomflex"]}
      />
      
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <Button variant="ghost" asChild>
                <Link to="/careers">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Careers
                </Link>
              </Button>
            </div>

            {/* Job Header */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <CardTitle className="text-3xl mb-4">{career.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {career.department && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {career.department}
                        </Badge>
                      )}
                      {career.employment_type && (
                        <Badge 
                          variant="outline" 
                          className={`${getEmploymentTypeColor(career.employment_type)} flex items-center gap-1`}
                        >
                          <Clock className="w-3 h-3" />
                          {career.employment_type.replace('-', ' ')}
                        </Badge>
                      )}
                      {career.location && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {career.location}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      Posted on {formatDate(career.created_at)}
                    </div>
                  </div>
                  
                  {career.apply_url && (
                    <div className="flex-shrink-0">
                      <Button asChild size="lg">
                        <a 
                          href={career.apply_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          Apply Now
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Job Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Job Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: career.description_html }}
                    />
                  </CardContent>
                </Card>

                {/* Requirements */}
                {career.requirements_html && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: career.requirements_html }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Apply Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ready to Apply?</CardTitle>
                    <CardDescription>
                      Join our team and help build the future of e-commerce.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {career.apply_url ? (
                      <Button asChild className="w-full">
                        <a 
                          href={career.apply_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          Apply Now
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button asChild className="w-full">
                        <a href="mailto:careers@ecomflex.com">
                          Send Resume
                        </a>
                      </Button>
                    )}
                    <p className="text-sm text-muted-foreground text-center">
                      Questions? Email us at{' '}
                      <a href="mailto:careers@ecomflex.com" className="text-primary hover:underline">
                        careers@ecomflex.com
                      </a>
                    </p>
                  </CardContent>
                </Card>

                {/* Company Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>About Ecomflex</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      We're a fast-growing e-commerce platform helping businesses worldwide build successful online stores.
                    </p>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/about">Learn More About Us</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default CareerDetail;