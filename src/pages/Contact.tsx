import { SEOHead } from "@/components/SEOHead";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { openWhatsApp } from "@/lib/utils";
const Contact = () => {
  const handleWhatsAppContact = () => {
    const message = "Hi! I'd like to know more about Ecomflex and how it can help my business.";
    openWhatsApp("+1234567890", message);
  };
  return <div className="min-h-screen">
      <SEOHead title="Contact Us - Ecomflex" description="Get in touch with the Ecomflex team. We're here to help you succeed with your e-commerce business." keywords={["contact ecomflex", "customer support", "help", "contact information"]} />
      <Navbar />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Contact Us
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                We're here to help you succeed. Get in touch with our team for support, questions, or partnership opportunities.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12">
                {/* Contact Cards */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <MessageCircle className="w-6 h-6 text-primary" />
                        WhatsApp Support
                      </CardTitle>
                      <CardDescription>
                        Get instant support through WhatsApp
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={handleWhatsAppContact} className="w-full">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact us on WhatsApp
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Mail className="w-6 h-6 text-primary" />
                        Email Support
                      </CardTitle>
                      <CardDescription>
                        Send us an email and we'll respond within 24 hours
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-medium">support@ecombuildr.com</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        For general inquiries and technical support
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Phone className="w-6 h-6 text-primary" />
                        Phone Support
                      </CardTitle>
                      <CardDescription>
                        Speak directly with our support team
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-medium">+8801776-911811</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Monday - Friday, 9AM - 6PM EST
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <MapPin className="w-6 h-6 text-primary" />
                        Office Location
                      </CardTitle>
                      <CardDescription>
                        Visit us at our headquarters
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-medium">123 Business Avenue</p>
                      <p className="text-muted-foreground">Suite 456</p>
                      <p className="text-muted-foreground">New York, NY 10001</p>
                      <p className="text-muted-foreground">United States</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Form or Additional Info */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Get Started Today</CardTitle>
                      <CardDescription>
                        Ready to build your e-commerce empire? We're here to help you every step of the way.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Sales Inquiries</h4>
                        <p className="text-sm text-muted-foreground">
                          Contact our sales team for pricing, demos, and custom solutions.
                        </p>
                        <p className="text-sm font-medium mt-2">sales@ecombuildr.com</p>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Technical Support</h4>
                        <p className="text-sm text-muted-foreground">
                          Need help with your store? Our technical team is ready to assist.
                        </p>
                        <p className="text-sm font-medium mt-2">tech@ecombuildr.com</p>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Partnerships</h4>
                        <p className="text-sm text-muted-foreground">
                          Interested in partnering with us? Let's explore opportunities together.
                        </p>
                        <p className="text-sm font-medium mt-2">partners@ecombuildr.com</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Business Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Sunday - Thursday</span>
                          <span className="font-medium">9:00 AM - 6:00 PM GMT</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Saterday</span>
                          <span className="font-medium">10:00 AM - 4:00 PM GMT</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Friday</span>
                          <span className="font-medium">Closed</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        Emergency support available 24/7 for enterprise customers.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppWidget />
    </div>;
};
export default Contact;