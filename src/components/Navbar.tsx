import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, Store, LogIn, ChevronDown } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { PlatformNavItem } from '@/types/platformNavigation';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('https://res.cloudinary.com/funnelsninja/image/upload/v1760233611/ecombuildr-logo-new-v2_lqelbr.png');
  const [navItems, setNavItems] = useState<PlatformNavItem[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_navigation_settings')
          .select('*')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching navigation:', error);
          return;
        }

        if (data) {
          if (data.logo_url) setLogoUrl(data.logo_url);
          if (data.nav_items) setNavItems(data.nav_items as unknown as PlatformNavItem[]);
        }
      } catch (error) {
        console.error('Error fetching navigation:', error);
      }
    };

    fetchNavigation();

    // Real-time subscription for live updates
    const channel = supabase
      .channel('platform-nav-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'platform_navigation_settings'
      }, () => {
        fetchNavigation();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const renderNavItem = (item: PlatformNavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    
    if (!hasChildren) {
      return item.external ? (
        <a
          key={item.id}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          {item.label}
        </a>
      ) : (
        <Link
          key={item.id}
          to={item.href}
          className="text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          {item.label}
        </Link>
      );
    }

    // Render dropdown for items with children
    return (
      <div key={item.id} className="relative group">
        <button className="text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1">
          {item.label}
          <ChevronDown className="h-3 w-3" />
        </button>
        
        <div className="absolute left-0 mt-2 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="py-2">
            {item.children.filter(child => child.enabled).map(child => (
              child.external ? (
                <a
                  key={child.id}
                  href={child.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {child.label}
                </a>
              ) : (
                <Link
                  key={child.id}
                  to={child.href}
                  className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {child.label}
                </Link>
              )
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/">
              <img 
                src={logoUrl}
                alt="EcomBuildr Logo" 
                className="h-10 w-auto hover:opacity-80 transition-opacity cursor-pointer"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map(item => renderNavItem(item))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Button asChild variant="accent" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
                <Button asChild variant="accent" size="sm">
                  <Link to="/#pricing">Get Started Free</Link>
                </Button>
              </>
            )}
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
              {navItems.map((item) => {
                const renderMobileItem = (navItem: PlatformNavItem, isChild = false) => (
                  navItem.external ? (
                    <a
                      key={navItem.id}
                      href={navItem.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block text-muted-foreground hover:text-foreground transition-colors duration-200 ${isChild ? 'pl-4' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {navItem.label}
                    </a>
                  ) : (
                    <Link
                      key={navItem.id}
                      to={navItem.href}
                      className={`block text-muted-foreground hover:text-foreground transition-colors duration-200 ${isChild ? 'pl-4' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {navItem.label}
                    </Link>
                  )
                );

                return (
                  <div key={item.id}>
                    {renderMobileItem(item)}
                    {item.children && item.children.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {item.children.filter(child => child.enabled).map(child => renderMobileItem(child, true))}
                      </div>
                    )}
                  </div>
                );
              })}
              
              <div className="pt-4 space-y-3 border-t border-border/50">
                {user ? (
                  <Button asChild variant="accent" className="w-full" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                      <Link to="/login">
                        <LogIn className="h-4 w-4 mr-2" />
                        Login
                      </Link>
                    </Button>
                    <Button asChild variant="accent" className="w-full" onClick={() => setIsMenuOpen(false)}>
                      <Link to="/#pricing">Get Started Free</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};