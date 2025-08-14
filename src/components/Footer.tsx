import { Button } from "@/components/ui/button";
import { 
  Store, 
  Facebook, 
  Twitter, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  ArrowRight 
} from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "প্রোডাক্ট",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Templates", href: "#templates" },
        { label: "Integrations", href: "#integrations" }
      ]
    },
    {
      title: "সাপোর্ট",
      links: [
        { label: "Help Center", href: "#help" },
        { label: "Documentation", href: "#docs" },
        { label: "Video Tutorials", href: "#tutorials" },
        { label: "Community", href: "#community" }
      ]
    },
    {
      title: "কোম্পানি",
      links: [
        { label: "About Us", href: "#about" },
        { label: "Success Stories", href: "#testimonials" },
        { label: "Careers", href: "#careers" },
        { label: "Contact", href: "#contact" }
      ]
    }
  ];

  return (
    <footer className="bg-primary text-white">
      {/* CTA Section */}
      <div className="border-b border-primary-light/20">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Start Building Your E-commerce Empire Today
            </h3>
            <p className="text-xl text-primary-light mb-8">
              Join thousands of successful entrepreneurs who've built profitable online stores with our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="lg" className="group">
                Start Free Trial
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white hover:text-primary">
                Contact Sales Team
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center">
              <img 
                src="https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-logo-white-big_xywiil.png" 
                alt="EcomBuildr Logo" 
                className="h-12 w-auto"
              />
            </div>
            
            <p className="text-primary-light leading-relaxed max-w-md">
              Build full-featured e-commerce sites with our powerful no-code platform. 
              Create professional stores, landing pages, and conversion-driven systems that turn visitors into customers.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-primary-light">
                <Phone className="h-4 w-4" />
                <span>+৮৮০ ১৭৭৭ ১২৩৪৫৬</span>
              </div>
              <div className="flex items-center gap-3 text-primary-light">
                <Mail className="h-4 w-4" />
                <span>support@ecombuildr.com</span>
              </div>
              <div className="flex items-center gap-3 text-primary-light">
                <MapPin className="h-4 w-4" />
                <span>Remote Team</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              <a 
                href="#" 
                className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h4 className="text-lg font-semibold">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href}
                      className="text-primary-light hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-light/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-light text-sm">
              © {currentYear} EcomBuildr. All rights reserved.
            </p>
            
            <div className="flex gap-6 text-sm text-primary-light">
              <a href="#privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#cookies" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};