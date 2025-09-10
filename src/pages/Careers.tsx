import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Building, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

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

const Careers = () => {
  const [careers, setCareers] = useState<CareerOpening[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    try {
      const { data, error } = await supabase
        .from('career_openings')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCareers(data || []);
    } catch (error) {
      console.error('Error fetching careers:', error);
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

  return (
    <>
      <SEOHead 
        title="Careers - Join Our Team | Ecomflex"
        description="Join the Ecomflex team and help shape the future of e-commerce. Explore our current job openings and career opportunities."
        keywords={["careers", "jobs", "ecomflex jobs", "ecommerce careers", "work at ecomflex"]}
      />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Join Our Team
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Help us build the future of e-commerce. We're looking for passionate, talented individuals to join our growing team.
              </p>
            </div>
          </div>
        </section>

        {/* Why Work With Us */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Work With Us?</h2>
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Growth Opportunities</h3>
                  <p className="text-muted-foreground">
                    Advance your career with continuous learning and development programs.
                  </p>
                </div>
                
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Work-Life Balance</h3>
                  <p className="text-muted-foreground">
                    Flexible hours, remote work options, and comprehensive benefits.
                  </p>
                </div>
                
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Global Impact</h3>
                  <p className="text-muted-foreground">
                    Work on products that empower businesses worldwide.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Job Openings */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Current Openings</h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading career opportunities...</p>
                </div>
              ) : careers.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-2xl font-semibold mb-4">No Current Openings</h3>
                  <p className="text-muted-foreground mb-6">
                    We don't have any open positions right now, but we're always looking for talented people.
                  </p>
                  <p className="text-muted-foreground">
                    Send us your resume at <strong>careers@ecomflex.com</strong> and we'll keep you in mind for future opportunities.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {careers.map((career) => (
                    <Card key={career.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <CardTitle className="text-xl mb-2">{career.title}</CardTitle>
                            <div className="flex flex-wrap gap-2">
                              {career.department && (
                                <Badge variant="outline">{career.department}</Badge>
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
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {career.location}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/careers/${career.id}`}>
                                View Details
                              </Link>
                            </Button>
                            {career.apply_url && (
                              <Button asChild size="sm">
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
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="prose prose-sm max-w-none text-muted-foreground"
                          dangerouslySetInnerHTML={{ 
                            __html: career.description_html.substring(0, 200) + '...' 
                          }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Don't See the Right Role?</h2>
              <p className="text-xl text-muted-foreground mb-8">
                We're always interested in hearing from talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
              </p>
              <Button asChild size="lg">
                <a href="mailto:careers@ecomflex.com">
                  Send Your Resume
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Careers;