import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEcomPaths } from '@/lib/pathResolver';

interface WebsiteData {
  id: string;
  name: string;
  settings?: any;
}

interface FooterLinkItem {
  id: string;
  label: string;
  type: 'page' | 'custom';
  page_slug?: string;
  url?: string;
  new_tab?: boolean;
}

interface GlobalFooterConfig {
  enabled: boolean;
  logo_url?: string;
  description?: string;
  links: FooterLinkItem[];
  style?: {
    bg_color?: string;
    text_color?: string;
    heading_color?: string;
    link_hover_color?: string;
  };
}

export const WebsiteFooter: React.FC<{ website: WebsiteData; }> = ({ website }) => {
  const cfg = (website.settings?.global_footer as GlobalFooterConfig | undefined);
  if (!cfg?.enabled) return null;
  const paths = useEcomPaths();

  const styleVars = useMemo(() => ({
    backgroundColor: cfg?.style?.bg_color || undefined,
    color: cfg?.style?.text_color || undefined,
  }) as React.CSSProperties, [cfg]);

  const quickLinks: FooterLinkItem[] = (cfg?.links && cfg.links.length > 0)
    ? cfg.links
    : [
        { id: 'home', label: 'Home', type: 'page', page_slug: '' },
        { id: 'products', label: 'Products', type: 'page', page_slug: 'products' },
        { id: 'about', label: 'About', type: 'page', page_slug: 'about' },
        { id: 'contact', label: 'Contact', type: 'page', page_slug: 'contact' },
      ];

  const customerLinks = [
    { id: 'shipping', label: 'Shipping Info', to: `${paths.base}/shipping` },
    { id: 'returns', label: 'Returns', to: `${paths.base}/returns` },
    { id: 'privacy', label: 'Privacy Policy', to: `${paths.base}/privacy-policy` },
    { id: 'terms', label: 'Terms of Service', to: `${paths.base}/terms-of-service` },
  ];

  return (
    <footer id="website-footer" className="border-t" style={styleVars}>
      {/* Hover style for links */}
      {cfg?.style?.link_hover_color && (
        <style>{`
          #website-footer a:hover { color: ${cfg.style.link_hover_color} !important; }
        `}</style>
      )}
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="max-w-md space-y-3">
            <Link to={paths.home} className="flex items-center gap-3">
              {cfg?.logo_url ? (
                <img src={cfg.logo_url} alt={`${website.name} logo`} className="h-8 w-auto object-contain" />
              ) : (
                <span className="font-semibold">{website.name}</span>
              )}
            </Link>
            {cfg?.description && (
              <p className="text-sm opacity-80">{cfg.description}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 w-full md:w-auto">
            <div className="md:text-right">
              <h3 className="font-semibold mb-3" style={{ color: cfg?.style?.heading_color || undefined }}>Quick Links</h3>
              <ul className="space-y-2">
                {quickLinks.map((l) => (
                  <li key={l.id}>
                    {l.type === 'custom' && l.url ? (
                      <a href={l.url} target={l.new_tab ? '_blank' : undefined} rel={l.new_tab ? 'noopener' : undefined} className="text-sm transition-colors" style={{ color: cfg?.style?.text_color || undefined }}>
                        {l.label}
                      </a>
                    ) : (
                      <Link to={l.page_slug ? `${paths.base}/${l.page_slug}` : paths.home} className="text-sm transition-colors" style={{ color: cfg?.style?.text_color || undefined }}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:text-right">
              <h3 className="font-semibold mb-3" style={{ color: cfg?.style?.heading_color || undefined }}>Customer Service</h3>
              <ul className="space-y-2">
                {customerLinks.map(link => (
                  <li key={link.id}>
                    <Link to={link.to} className="text-sm transition-colors" style={{ color: cfg?.style?.text_color || undefined }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-sm opacity-80">
          © {new Date().getFullYear()} {website.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};