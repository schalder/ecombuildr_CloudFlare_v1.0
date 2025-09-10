import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingCart } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useEcomPaths } from '@/lib/pathResolver';

interface FunnelData {
  id: string;
  name: string;
  slug: string;
  settings?: any;
}

interface HeaderNavItem {
  id: string;
  label: string;
  type: 'step' | 'custom';
  step_slug?: string;
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
  font_size?: string;
  style?: {
    bg_color?: string;
    text_color?: string;
    hover_color?: string;
    hamburger_color?: string;
  };
}

export const FunnelHeader: React.FC<{ funnel: FunnelData; }> = ({ funnel }) => {
  const cfg = (funnel.settings?.global_header as GlobalHeaderConfig | undefined);
  const enabled = cfg?.enabled;
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const paths = useEcomPaths();

  const fontSizeClass = useMemo(() => {
    switch (cfg?.font_size) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      case 'extra-large': return 'text-xl';
      default: return 'text-base';
    }
  }, [cfg?.font_size]);

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
        <a href={item.url} target={item.new_tab ? '_blank' : undefined} rel={item.new_tab ? 'noopener' : undefined} className={`${fontSizeClass} transition-colors`} style={{ color: cfg?.style?.text_color || undefined }}>
          {item.label}
        </a>
      );
    }
    const stepSlug = item.step_slug || '';
    // Use clean URL for custom domains, fallback to full funnel path
    const to = stepSlug ? `/${stepSlug}` : paths.home;
    return (
      <Link to={to} className={`${fontSizeClass} transition-colors`} style={{ color: cfg?.style?.text_color || undefined }}>{item.label}</Link>
    );
  };

  const handleSearch = () => {
    // For funnels, search functionality might be disabled or redirect to store
    
  };

  const handleCart = () => {
    // For funnels, cart functionality might be disabled or redirect to store
    
  };

  return (
    <header id="funnel-header" className={`${cfg?.sticky ? 'sticky top-0 z-40' : ''} border-b`} style={styleVars}>
      {/* Inline style for hover color */}
      {hoverStyle && (
        <style>{`
          #funnel-header nav a:hover { color: ${hoverStyle} !important; }
        `}</style>
      )}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={paths.home} className="flex items-center gap-3">
          {cfg?.logo_url ? (
            <img src={cfg.logo_url} alt={`${funnel.name} logo`} className="h-8 w-auto object-contain" />
          ) : (
            <span className="font-semibold">{funnel.name}</span>
          )}
        </Link>
        <div className="hidden md:flex items-center gap-6 ml-auto">
          <nav className="flex items-center gap-6">
            {cfg?.nav_items?.map((item) => (
              <div key={item.id}>{renderLink(item)}</div>
            ))}
          </nav>
          <div className="flex items-center gap-3 ml-4">
            {cfg?.show_search && (
              <Button variant="ghost" size="icon" onClick={handleSearch} aria-label="Search">
                <Search className="w-5 h-5" style={{ color: cfg?.style?.text_color || undefined }} />
              </Button>
            )}
            {cfg?.show_cart && (
              <Button variant="ghost" size="icon" onClick={handleCart} aria-label="Cart" className="relative">
                <ShoppingCart className="w-5 h-5" style={{ color: cfg?.style?.text_color || undefined }} />
                {itemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
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
                    <img src={cfg.logo_url} alt={`${funnel.name} logo`} className="h-8 w-auto object-contain" />
                  ) : (
                    <span className="font-semibold">{funnel.name}</span>
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