import React from 'react';
import { Menu } from 'lucide-react';
import { elementRegistry } from './ElementRegistry';
import { PageBuilderElement, ElementType } from '../types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { renderElementStyles, hasUserBackground } from '../utils/styleRenderer';
import { generateResponsiveCSS, mergeResponsiveStyles } from '../utils/responsiveStyles';

// Navigation Menu Element Component
const NavigationMenuElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, deviceType = 'desktop' }) => {
  type MenuItem = { id: string; label: string; type?: 'url'|'page'; url?: string; pagePath?: string; children?: MenuItem[] };
  const items: MenuItem[] = element.content.items || [];
  const logoUrl: string | undefined = element.content.logoUrl;
  const logoAlt: string = element.content.logoAlt || 'Logo';
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const openTimer = React.useRef<number | null>(null);
  const closeTimer = React.useRef<number | null>(null);

  const onEnter = (id: string) => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (openTimer.current) window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => setHoveredId(id), 80);
  };

  const onLeave = (id: string) => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setHoveredId((cur) => (cur === id ? null : cur));
    }, 160);
  };

  React.useEffect(() => {
    return () => {
      if (openTimer.current) window.clearTimeout(openTimer.current);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const isMobileView = deviceType === 'mobile';

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

  const merged = mergeResponsiveStyles({}, element.styles, deviceType || 'desktop');
  const linkColor: string | undefined = element.content.linkColor || (merged?.color as string) || undefined;
  const hoverColor: string | undefined = element.content.linkHoverColor || undefined;
  const submenuHoverBg: string | undefined = element.content.submenuHoverBgColor || undefined;
  const hamburgerIconColor: string | undefined = element.content.hamburgerIconColor || undefined;
  const hamburgerIconHoverColor: string | undefined = element.content.hamburgerIconHoverColor || undefined;
  const uniqueClass = `pb-nav-${element.id}`;

  const textStyles: React.CSSProperties = {
    color: linkColor,
    fontSize: merged?.fontSize,
    lineHeight: merged?.lineHeight,
    fontWeight: merged?.fontWeight,
    fontFamily: merged?.fontFamily,
  };
  const justifyMap: Record<string, React.CSSProperties['justifyContent']> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  };
  const itemGap = element.content.menuGap ?? 24;
  const listInlineStyle: React.CSSProperties = {
    ...textStyles,
    justifyContent: justifyMap[(merged?.textAlign as string) || 'right'],
    columnGap: typeof itemGap === 'number' ? `${itemGap}px` : (itemGap as any),
  };
  const desktopNavClass = deviceType ? (deviceType === 'mobile' ? 'hidden' : 'block') : 'hidden md:block';
  const mobileWrapperClass = deviceType ? (deviceType === 'mobile' ? 'block' : 'hidden') : 'md:hidden';
  const globalCSS = `${generateResponsiveCSS(element.id, element.styles)}${hoverColor ? ` .${uniqueClass}:hover { color: ${hoverColor} !important; }` : ''}${submenuHoverBg ? ` .${uniqueClass}-submenu:hover { background-color: ${submenuHoverBg} !important; }` : ''}${hamburgerIconHoverColor ? ` .${uniqueClass}-hamburger:hover svg { color: ${hamburgerIconHoverColor} !important; }` : ''}`;
  return (
    <>
      <style>{globalCSS}</style>
      <header
        className={[`element-${element.id}`, 'w-full relative z-[60] overflow-visible', !hasUserBackground(element.styles) ? 'bg-background' : ''].join(' ').trim()}
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
        <nav className={`${desktopNavClass} flex-1`}>
          <ul className="flex items-center w-full" style={listInlineStyle}>
            {items.map((item) => (
              <li key={item.id} className="relative" onMouseEnter={() => onEnter(item.id)} onMouseLeave={() => onLeave(item.id)}>
                <a
                  href={resolveHref(item)}
                  onClick={(e) => handleNav(e, resolveHref(item))}
                  className={`${uniqueClass} px-3 py-2 font-medium transition-colors`}
                  style={textStyles}
                >
                  {item.label}
                </a>
                  {item.children && item.children.length > 0 && (
                    <>
                      <div
                        className={`absolute right-6 top-[calc(100%)] w-2 h-2 bg-card rotate-45 border-l border-t z-50 transition-opacity pointer-events-none ${hoveredId === item.id ? 'opacity-100' : 'opacity-0'}`}
                        aria-hidden="true"
                      />
                      <ul
                        className={`absolute right-0 top-full mt-0 min-w-[220px] bg-card border rounded-md shadow-md z-50 transition-all ${hoveredId === item.id ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'}`}
                        onMouseEnter={() => onEnter(item.id)}
                        onMouseLeave={() => onLeave(item.id)}
                      >
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <a
                              href={resolveHref(child)}
                              onClick={(e) => handleNav(e, resolveHref(child))}
                              className={`${uniqueClass} ${submenuHoverBg ? `${uniqueClass}-submenu` : 'hover:bg-accent hover:text-accent-foreground'} block px-3 py-2 rounded`}
                              style={textStyles}
                            >
                              {child.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile hamburger */}
        <div className={mobileWrapperClass}>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu" className={`${uniqueClass}-hamburger`}>
                <Menu className="h-5 w-5" style={{ color: hamburgerIconColor || linkColor }} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 z-[60]">
              <div className="mt-6">
                <ul className="space-y-2" style={textStyles}>
                  {items.map((item) => (
                    <li key={item.id}>
                      <a
                        href={resolveHref(item)}
                        onClick={(e) => handleNav(e, resolveHref(item))}
                        className={`${uniqueClass} block px-2 py-2 rounded hover:bg-accent hover:text-accent-foreground`}
                        style={textStyles}
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
                            className={`${uniqueClass} ${submenuHoverBg ? `${uniqueClass}-submenu` : 'hover:bg-accent hover:text-accent-foreground'} block px-2 py-1 rounded`}
                            style={textStyles}
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
      linkColor: '#333333',
      linkHoverColor: '#111111',
      submenuHoverBgColor: '',
      menuGap: 24,
      hamburgerIconColor: '#333333',
      hamburgerIconHoverColor: '#111111',
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
