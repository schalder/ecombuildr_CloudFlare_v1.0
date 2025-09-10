import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface SiteTemplate {
  id: string;
  name: string;
  image_url: string;
  demo_url: string | null;
  sort_order: number;
}

const Templates = () => {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['site-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_templates')
        .select('id, name, image_url, demo_url, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SiteTemplate[];
    },
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
                <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <WhatsAppWidget />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Templates - eComBuildr | Ready-to-Use E-commerce Templates</title>
        <meta 
          name="description" 
          content="Browse our collection of professional e-commerce templates. Ready-to-use designs that help you create stunning online stores quickly." 
        />
        <meta name="keywords" content="ecommerce templates, website templates, online store templates, eComBuildr" />
      </Helmet>

      <Navbar />
      
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">
              Professional E-commerce Templates
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from our collection of stunning, mobile-responsive templates designed to help you create the perfect online store.
            </p>
          </div>

          {/* Templates Grid */}
          {templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.map((template) => (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="h-[260px] md:h-[320px] lg:h-[360px] overflow-hidden rounded-t-lg bg-muted">
                      <img
                        src={template.image_url}
                        alt={template.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-6">
                    <div className="w-full">
                      <h3 className="text-lg font-semibold mb-3">
                        {template.name}
                      </h3>
                      
                      {template.demo_url && (
                        <Button 
                          asChild
                          variant="outline" 
                          className="w-full"
                        >
                          <a
                            href={template.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Demo
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-semibold mb-4">Templates Coming Soon</h2>
                <p className="text-muted-foreground">
                  We're working on adding beautiful templates to our collection. 
                  Check back soon for amazing designs!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppWidget />
    </>
  );
};

export default Templates;