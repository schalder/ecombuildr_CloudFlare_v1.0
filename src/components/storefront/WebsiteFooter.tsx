import React, { useMemo } from 'react';
// Removed SPA Link in favor of full reload anchors
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

interface FooterLinkSection {
  id: string;
  title: string;
  links: FooterLinkItem[];
}

interface GlobalFooterConfig {
  enabled: boolean;
  logo_url?: string;
  description?: string;
  disclaimer_content?: string;
  copyright_text?: string;
  link_sections: FooterLinkSection[];
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

  const linkSections: FooterLinkSection[] = (cfg?.link_sections && cfg.link_sections.length > 0)
    ? cfg.link_sections
    : [
        { 
          id: 'quick-links',
          title: 'Quick Links',
          links: [
            { id: 'home', label: 'Home', type: 'page', page_slug: '' },
            { id: 'products', label: 'Products', type: 'page', page_slug: 'products' },
            { id: 'about', label: 'About', type: 'page', page_slug: 'about' },
            { id: 'contact', label: 'Contact', type: 'page', page_slug: 'contact' },
          ]
        },
        {
          id: 'customer-service',
          title: 'Customer Service',
          links: [
            { id: 'shipping', label: 'Shipping Info', type: 'custom', url: `${paths.base}/shipping` },
            { id: 'returns', label: 'Returns', type: 'custom', url: `${paths.base}/returns` },
            { id: 'privacy', label: 'Privacy Policy', type: 'custom', url: `${paths.base}/privacy-policy` },
            { id: 'terms', label: 'Terms of Service', type: 'custom', url: `${paths.base}/terms-of-service` },
          ]
        }
      ];

  const copyrightText = cfg?.copyright_text 
    ? cfg.copyright_text
        .replace('{year}', new Date().getFullYear().toString())
        .replace('{website_name}', website.name)
    : `© ${new Date().getFullYear()} ${website.name}. All rights reserved.`;

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
            <a href={paths.home} className="flex items-center gap-3">
              {cfg?.logo_url ? (
                <img src={cfg.logo_url} alt={`${website.name} logo`} className="h-8 w-auto object-contain" />
              ) : (
                <span className="font-semibold">{website.name}</span>
              )}
            </a>
            {cfg?.description && (
              <p className="text-sm opacity-80">{cfg.description}</p>
            )}
          </div>
          <div className={`grid gap-8 md:gap-12 w-full md:w-auto ${linkSections.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : linkSections.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
            {linkSections.map((section) => (
              <div key={section.id} className="md:text-right">
                <h3 className="font-semibold mb-3" style={{ color: cfg?.style?.heading_color || undefined }}>
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.id}>
                      {link.type === 'custom' && link.url ? (
                        // Check if it's an external URL or internal
                        link.url.startsWith('http://') || link.url.startsWith('https://') ? (
                          <a 
                            href={link.url} 
                            target={link.new_tab ? '_blank' : undefined} 
                            rel={link.new_tab ? 'noopener' : undefined} 
                            className="text-sm transition-colors" 
                            style={{ color: cfg?.style?.text_color || undefined }}
                          >
                            {link.label}
                          </a>
                        ) : (
                          <a 
                            href={link.url} 
                            target={link.new_tab ? '_blank' : undefined}
                            rel={link.new_tab ? 'noopener' : undefined}
                            className="text-sm transition-colors" 
                            style={{ color: cfg?.style?.text_color || undefined }}
                          >
                            {link.label}
                          </a>
                        )
                      ) : (
                        <a 
                          href={link.page_slug ? `${paths.base}/${link.page_slug}` : paths.home} 
                          target={link.new_tab ? '_blank' : undefined}
                          rel={link.new_tab ? 'noopener' : undefined}
                          className="text-sm transition-colors" 
                          style={{ color: cfg?.style?.text_color || undefined }}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {cfg?.disclaimer_content && (
          <div className="mt-8 text-xs opacity-70 prose prose-sm max-w-none" 
            dangerouslySetInnerHTML={{ __html: cfg.disclaimer_content }} 
            style={{ color: cfg?.style?.text_color || undefined }}
          />
        )}
        <div className="border-t mt-8 pt-6 text-center text-sm opacity-80">
          {copyrightText}
        </div>
      </div>
    </footer>
  );
};