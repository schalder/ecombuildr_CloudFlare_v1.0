import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PageData {
  id: string;
  title: string;
  slug: string;
  content: any;
  seo_title?: string;
  seo_description?: string;
}

interface PageSection {
  type: string;
  content: any;
}

const PageContentRenderer: React.FC<{ sections: PageSection[] }> = ({ sections }) => {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, you would send this to your backend
    toast({
      title: "Message Sent",
      description: "Thank you for your message. We'll get back to you soon!",
    });
    setContactForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="space-y-12">
      {sections.map((section, index) => {
        switch (section.type) {
          case 'content':
            return (
              <div key={index} className="prose prose-lg max-w-none">
                <h1 className="text-3xl font-bold mb-6">{section.content.title}</h1>
                {section.content.image && (
                  <img 
                    src={section.content.image} 
                    alt={section.content.title}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}
                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {section.content.text}
                </div>
              </div>
            );

          case 'contact_form':
            return (
              <div key={index}>
                <div className="text-center mb-12">
                  <h1 className="text-3xl font-bold mb-4">{section.content.title}</h1>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {section.content.text}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Contact Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Send us a message</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div>
                          <Input
                            placeholder="Your Name"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="email"
                            placeholder="Your Email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Textarea
                            placeholder="Your Message"
                            rows={5}
                            value={contactForm.message}
                            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Send Message
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {section.content.email && (
                          <div>
                            <h4 className="font-medium">Email</h4>
                            <p className="text-muted-foreground">{section.content.email}</p>
                          </div>
                        )}
                        {section.content.phone && (
                          <div>
                            <h4 className="font-medium">Phone</h4>
                            <p className="text-muted-foreground">{section.content.phone}</p>
                          </div>
                        )}
                        {section.content.address && (
                          <div>
                            <h4 className="font-medium">Address</h4>
                            <p className="text-muted-foreground">{section.content.address}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            );

          case 'products_grid':
            return (
              <div key={index}>
                <h1 className="text-3xl font-bold mb-8">{section.content.title}</h1>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Product grid will be implemented here</p>
                </div>
              </div>
            );

          default:
            return (
              <div key={index} className="prose prose-lg max-w-none">
                <pre className="text-sm bg-muted p-4 rounded">
                  {JSON.stringify(section, null, 2)}
                </pre>
              </div>
            );
        }
      })}
    </div>
  );
};

export const StorefrontPage: React.FC = () => {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const { store, loadStore } = useStore();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        // Load store if not already loaded
        if (!store || store.slug !== slug) {
          await loadStore(slug);
        }

        // Get the current store (it should be loaded by now)
        const { data: storeData } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (!storeData) {
          setError('Store not found');
          return;
        }

        // Fetch the page by slug and store_id
        const { data: pageData, error: pageError } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', pageSlug || '')
          .eq('store_id', storeData.id)
          .eq('is_published', true)
          .single();

        if (pageError) {
          if (pageError.code === 'PGRST116') {
            setError('Page not found');
          } else {
            setError('Failed to load page');
          }
          return;
        }

        setPage(pageData);
      } catch (err) {
        console.error('Error fetching page:', err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, pageSlug, store, loadStore]);

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-8 min-h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </StorefrontLayout>
    );
  }

  if (error || !page) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-8 min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Page Not Found</h1>
            <p className="text-muted-foreground">{error || 'The requested page could not be found.'}</p>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  // Set up SEO metadata
  if (page.seo_title) {
    document.title = page.seo_title;
  }
  if (page.seo_description) {
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', page.seo_description);
    }
  }

  return (
    <StorefrontLayout>
      <div className="container mx-auto px-4 py-8">
        {page.content?.sections ? (
          <PageContentRenderer sections={page.content.sections} />
        ) : (
          <div>
            <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
            <p className="text-muted-foreground">This page is still being set up.</p>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
};