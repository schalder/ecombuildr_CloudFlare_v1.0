import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string[];
  canonical?: string;
  noIndex?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'EcomBuildr - Build Your E-commerce Empire in Minutes',
  description = 'Create professional e-commerce stores with our no-code platform. Build websites, funnels, and conversion systems that turn visitors into customers.',
  ogImage = 'https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-og-image_default.jpg',
  keywords = [],
  canonical,
  noIndex = false
}) => {
  const currentUrl = canonical || window.location.href;
  const keywordsString = keywords.length > 0 ? keywords.join(', ') : 'ecommerce builder, online store, no code, bangladesh ecommerce';

  useEffect(() => {
    // Update document title
    document.title = title;
  }, [title]);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {!noIndex && <meta name="robots" content="index, follow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="EcomBuildr" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@ecombuildr" />
      
      {/* Additional SEO Tags */}
      <meta name="author" content="EcomBuildr" />
      <meta name="language" content="en" />
      <meta name="theme-color" content="#10B981" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "EcomBuildr",
          "url": "https://ecombuildr.com",
          "logo": "https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-logo-big_vifrmg.png",
          "description": description,
          "sameAs": [
            "https://facebook.com/ecombuildr",
            "https://twitter.com/ecombuildr"
          ]
        })}
      </script>
    </Helmet>
  );
};