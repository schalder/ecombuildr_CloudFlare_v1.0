import React from 'react';
import { useSEO } from '@/hooks/useSEO';

interface SEOPageStructureProps {
  pageSlug: string;
  defaultTitle?: string;
  defaultDescription?: string;
  keywords?: string[];
  children: React.ReactNode;
  className?: string;
}

/**
 * Ensures proper SEO structure with H1 tags and semantic HTML
 */
export const SEOPageStructure: React.FC<SEOPageStructureProps> = ({
  pageSlug,
  defaultTitle,
  defaultDescription,
  keywords = [],
  children,
  className = ''
}) => {
  const { seoData, loading } = useSEO(pageSlug);
  
  const title = seoData?.title || defaultTitle;
  const description = seoData?.description || defaultDescription;
  const pageKeywords = seoData?.keywords || keywords;

  // Add keywords to page content for SEO
  const keywordContent = pageKeywords.length > 0 ? (
    <div className="sr-only">
      Keywords: {pageKeywords.join(', ')}
    </div>
  ) : null;

  if (loading) {
    return (
      <main className={`min-h-screen ${className}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${className}`} role="main">
      {/* Hidden SEO content for crawlers */}
      {keywordContent}
      
      {/* Page header with H1 - critical for SEO */}
      {title && (
        <header className="bg-gradient-to-b from-background/50 to-background border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                {description}
              </p>
            )}
          </div>
        </header>
      )}

      {/* Main content area */}
      <section className="flex-1">
        {children}
      </section>

      {/* Structured data for breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": window.location.origin
              },
              ...(pageSlug && pageSlug !== '' ? [{
                "@type": "ListItem",
                "position": 2,
                "name": title || pageSlug,
                "item": `${window.location.origin}/${pageSlug}`
              }] : [])
            ]
          })
        }}
      />
    </main>
  );
};