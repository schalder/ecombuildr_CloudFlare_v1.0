import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingCart } from 'lucide-react';
import { useEcomPaths } from '@/lib/pathResolver';
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface WebsiteData {
  id: string;
  name: string;
  settings?: any;
}

interface HeaderNavItem {
  id: string;
  label: string;
  type: 'page' | 'custom';
  page_slug?: string;
  url?: string;
  new_tab?: boolean;
}

interface GlobalHeaderConfig {
  enabled: boolean;
  logo_url?: string;
  nav_items: HeaderNavItem[];
  show_search: boolean;
  show_cart: boolean;
  sticky: boolean;
  style?: {
    bg_color?: string;
    text_color?: string;
    hover_color?: string;
    hamburger_color?: string;
  };
}

export const WebsiteHeader: React.FC<{ website: WebsiteData; }> = ({ website }) => {
  const cfg = (website.settings?.global_header as GlobalHeaderConfig | undefined);
  const enabled = cfg?.enabled;
  const paths = useEcomPaths();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const styleVars = useMemo(() => ({
    backgroundColor: cfg?.style?.bg_color || undefined,
    color: cfg?.style?.text_color || undefined,
  }) as React.CSSProperties, [cfg]);

  const hoverStyle = cfg?.style?.hover_color;
  const hamburgerColor = cfg?.style?.hamburger_color;

  if (!enabled) return null;

  const renderLink = (item: HeaderNavItem) => {
    if (item.type === 'custom' && item.url) {
      return (
        <a href={item.url} target={item.new_tab ? '_blank' : undefined} rel={item.new_tab ? 'noopener' : undefined} className="text-sm transition-colors" style={{ color: cfg?.style?.text_color || undefined }}>
          {item.label}
        </a>
      );
    }
    const slug = item.page_slug || '';
    const to = slug ? `${paths.base}/${slug}` : paths.home;
    return (
      <Link to={to} className="text-sm transition-colors" style={{ color: cfg?.style?.text_color || undefined }}>{item.label}</Link>
    );
  };

  const handleSearch = () => navigate(paths.products);
  const handleCart = () => navigate(paths.cart);

  return (
    <header id="website-header" className={`${cfg?.sticky ? 'sticky top-0 z-40' : ''} border-b`} style={styleVars}>
      {/* Inline style for hover color */}
      {hoverStyle && (
        <style>{`
          #website-header nav a:hover { color: ${hoverStyle} !important; }
        `}</style>
      )}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={paths.home} className="flex items-center gap-3">
          {cfg?.logo_url ? (
            <img src={cfg.logo_url} alt={`${website.name} logo`} className="h-8 w-auto object-contain" />
          ) : (
            <span className="font-semibold">{website.name}</span>
          )}
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {cfg?.nav_items?.map((item) => (
            <div key={item.id}>{renderLink(item)}</div>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {cfg?.show_search && (
            <Button variant="ghost" size="icon" onClick={handleSearch} aria-label="Search">
              <Search className="w-5 h-5" style={{ color: cfg?.style?.text_color || undefined }} />
            </Button>
          )}
          {cfg?.show_cart && (
            <Button variant="ghost" size="icon" onClick={handleCart} aria-label="Cart">
              <ShoppingCart className="w-5 h-5" style={{ color: cfg?.style?.text_color || undefined }} />
            </Button>
          )}
        </div>
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="w-6 h-6" style={{ color: hamburgerColor || cfg?.style?.text_color || undefined }} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <div className="flex items-center gap-3 py-2">
                  {cfg?.logo_url ? (
                    <img src={cfg.logo_url} alt={`${website.name} logo`} className="h-8 w-auto object-contain" />
                  ) : (
                    <span className="font-semibold">{website.name}</span>
                  )}
                </div>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                {cfg?.nav_items?.map((item) => (
                  <div key={item.id} onClick={() => setOpen(false)}>
                    {renderLink(item)}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3">
                {cfg?.show_search && (
                  <Button className="flex-1" variant="outline" onClick={() => { setOpen(false); handleSearch(); }}>Search</Button>
                )}
                {cfg?.show_cart && (
                  <Button className="flex-1" onClick={() => { setOpen(false); handleCart(); }}>Cart</Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};