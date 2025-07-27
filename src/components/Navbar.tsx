import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Store, LogIn } from "lucide-react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Success Stories", href: "#testimonials" },
    { label: "Support", href: "#support" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">F-Commerce Pro</h1>
              <p className="text-xs text-muted-foreground">by StoreBuilder</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
            <Button variant="accent" size="sm">
              ফ্রি শুরু করুন
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block text-muted-foreground hover:text-foreground transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              
              <div className="pt-4 space-y-3 border-t border-border/50">
                <Button variant="ghost" className="w-full justify-start">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
                <Button variant="accent" className="w-full">
                  ফ্রি শুরু করুন
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};