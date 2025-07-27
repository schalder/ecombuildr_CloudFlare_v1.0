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
              আজই শুরু করুন আপনার ই-কমার্স যাত্রা
            </h3>
            <p className="text-xl text-primary-light mb-8">
              হাজারো সফল ব্যবসায়ীর মতো আপনিও তৈরি করুন নিজের প্রফেশনাল অনলাইন স্টোর
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="lg" className="group">
                ৭ দিন ফ্রি ট্রায়াল শুরু করুন
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white hover:text-primary">
                বিক্রয় দলের সাথে কথা বলুন
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
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <Store className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">F-Commerce Pro</h1>
                <p className="text-primary-light">by StoreBuilder</p>
              </div>
            </div>
            
            <p className="text-primary-light leading-relaxed max-w-md">
              বাংলাদেশী F-Commerce ব্যবসায়ীদের জন্য সবচেয়ে সহজ এবং শক্তিশালী 
              ই-কমার্স প্ল্যাটফর্ম। কোডিং ছাড়াই তৈরি করুন প্রফেশনাল অনলাইন স্টোর।
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-primary-light">
                <Phone className="h-4 w-4" />
                <span>+৮৮০ ১৭৭৭ ১২৩৪৫৬</span>
              </div>
              <div className="flex items-center gap-3 text-primary-light">
                <Mail className="h-4 w-4" />
                <span>support@fcommercepro.com</span>
              </div>
              <div className="flex items-center gap-3 text-primary-light">
                <MapPin className="h-4 w-4" />
                <span>ঢাকা, বাংলাদেশ</span>
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
              © {currentYear} F-Commerce Pro. All rights reserved.
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