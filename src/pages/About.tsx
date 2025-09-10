import { SEOHead } from "@/components/SEOHead";
import { Users, Target, Heart } from "lucide-react";

const About = () => {
  return (
    <>
      <SEOHead 
        title="About Us - Ecomflex"
        description="Learn about Ecomflex's mission to empower businesses with powerful e-commerce solutions. Discover our story and meet our team."
        keywords={["about ecomflex", "ecommerce platform", "our mission", "our team"]}
      />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                About Ecomflex
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Empowering businesses to build beautiful, high-converting e-commerce stores with ease.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Story</h2>
              <div className="prose prose-lg max-w-none text-center">
                <p className="text-lg text-muted-foreground mb-6">
                  Founded with a vision to democratize e-commerce, Ecomflex was born from the understanding that 
                  every business deserves a powerful online presence. We saw too many entrepreneurs struggling 
                  with complex platforms and technical barriers that stood between them and their dreams.
                </p>
                <p className="text-lg text-muted-foreground">
                  Today, we're proud to serve thousands of businesses worldwide, providing them with the tools 
                  and support they need to build successful online stores. From small startups to growing 
                  enterprises, our platform scales with your ambition.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-12">Our Mission</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-sm">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Simplify E-commerce</h3>
                  <p className="text-muted-foreground text-center">
                    Making e-commerce accessible to everyone, regardless of technical expertise.
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-sm">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Empower Growth</h3>
                  <p className="text-muted-foreground text-center">
                    Providing tools that scale with your business from day one to enterprise level.
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-sm">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Build Community</h3>
                  <p className="text-muted-foreground text-center">
                    Fostering a community of successful entrepreneurs and business owners.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Meet Our Team</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-16 h-16 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Sarah Johnson</h3>
                  <p className="text-primary mb-2">CEO & Founder</p>
                  <p className="text-muted-foreground text-sm">
                    10+ years in e-commerce, passionate about helping businesses succeed online.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-16 h-16 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Mike Chen</h3>
                  <p className="text-primary mb-2">CTO</p>
                  <p className="text-muted-foreground text-sm">
                    Tech visionary focused on building scalable, user-friendly platforms.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-16 h-16 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Emily Rodriguez</h3>
                  <p className="text-primary mb-2">Head of Customer Success</p>
                  <p className="text-muted-foreground text-sm">
                    Dedicated to ensuring every customer achieves their e-commerce goals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default About;