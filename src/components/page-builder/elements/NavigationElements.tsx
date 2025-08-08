import React from 'react';
import { Menu } from 'lucide-react';
import { elementRegistry } from './ElementRegistry';
import { PageBuilderElement, ElementType } from '../types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { renderElementStyles, hasUserBackground } from '../utils/styleRenderer';
import { generateResponsiveCSS } from '../utils/responsiveStyles';

// Navigation Menu Element Component
const NavigationMenuElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing }) => {
  type MenuItem = { id: string; label: string; type?: 'url'|'page'; url?: string; pagePath?: string; children?: MenuItem[] };
  const items: MenuItem[] = element.content.items || [];
  const logoUrl: string | undefined = element.content.logoUrl;
  const logoAlt: string = element.content.logoAlt || 'Logo';

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href?: string) => {
    if (isEditing) {
      e.preventDefault();
      e.stopPropagation();
    } else if (href && href !== '#') {
      if (href.startsWith('http')) {
        window.location.href = href;
      } else {
        window.location.assign(href);
      }
    }
  };

  const resolveHref = (item: MenuItem) => {
    if ((item.type || 'url') === 'url') return item.url || '#';
    return item.pagePath || '#';
  };

  const containerStyles = renderElementStyles(element);

  return (
    <>
      <style>{generateResponsiveCSS(element.id, element.styles)}</style>
      <header
        className={[`element-${element.id}`, 'w-full relative z-[60]', !hasUserBackground(element.styles) ? 'bg-background' : ''].join(' ').trim()}
        style={containerStyles}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={logoAlt} className="h-8 w-auto" />
          ) : (
            <div className="h-8 w-24 bg-muted rounded" aria-label="Logo placeholder" />
          )}
        </div>

        {/* Desktop menu */}
        <nav className="hidden md:block">
          <ul className="flex items-center gap-6">
            {items.map((item) => (
              <li key={item.id} className="relative group">
                <a
                  href={resolveHref(item)}
                  onClick={(e) => handleNav(e, resolveHref(item))}
                  className="text-sm hover:underline"
                >
                  {item.label}
                </a>
                {item.children && item.children.length > 0 && (
                  <ul className="absolute left-0 top-full mt-2 min-w-[200px] bg-card border rounded-md shadow-md z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <a
                          href={resolveHref(child)}
                          onClick={(e) => handleNav(e, resolveHref(child))}
                          className="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          {child.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 z-[60]">
              <div className="mt-6">
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id}>
                      <a
                        href={resolveHref(item)}
                        onClick={(e) => handleNav(e, resolveHref(item))}
                        className="block px-2 py-2 rounded hover:bg-accent hover:text-accent-foreground"
                      >
                        {item.label}
                      </a>
                      {item.children && item.children.length > 0 && (
                        <ul className="ml-2 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <li key={child.id}>
                              <a
                                href={resolveHref(child)}
                                onClick={(e) => handleNav(e, resolveHref(child))}
                                className="block px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground text-sm"
                              >
                                {child.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        </div>
      </header>
    </>
  );
};

// Register Navigation Elements
export const registerNavigationElements = () => {
  elementRegistry.register({
    id: 'navigation-menu',
    name: 'Navigation Menu',
    category: 'custom',
    icon: Menu,
    component: NavigationMenuElement,
    defaultContent: {
      logoUrl: '',
      logoAlt: 'Logo',
      items: [
        { id: 'home', label: 'Home', type: 'url', url: '/', children: [] },
        { id: 'shop', label: 'Shop', type: 'url', url: '/products', children: [
          { id: 'new', label: 'New Arrivals', type: 'url', url: '/products?sort=new' },
          { id: 'sale', label: 'Sale', type: 'url', url: '/products?tag=sale' },
        ]}
      ]
    },
    description: 'Responsive header with logo, menu and submenus'
  });
};
