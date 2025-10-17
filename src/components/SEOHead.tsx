import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  socialImageUrl?: string;
  keywords?: string[];
  canonical?: string;
  noIndex?: boolean;
  author?: string;
  languageCode?: string;
  metaRobots?: string;
  customMetaTags?: { name: string; content: string }[];
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'EcomBuildr - Build Your E-commerce Empire in Minutes',
  description = 'Create professional e-commerce stores with our no-code platform. Build websites, funnels, and conversion systems that turn visitors into customers.',
  ogImage = 'https://res.cloudinary.com/funnelsninja/image/upload/v1755487166/ecombuildr-thumbnail_lntuqq.jpg',
  socialImageUrl,
  keywords = [],
  canonical,
  noIndex = false,
  author,
  languageCode = 'en',
  metaRobots = 'index,follow',
  customMetaTags = []
}) => {
  const currentUrl = canonical || window.location.href;
  const keywordsString = keywords.length > 0 ? keywords.join(', ') : 'ecommerce builder, online store, no code, bangladesh ecommerce';
  const finalOgImage = socialImageUrl || ogImage;

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
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : metaRobots} />
      
      {/* Author */}
      {author && <meta name="author" content={author} />}
      
      {/* Language */}
      <meta name="language" content={languageCode} />
      
      {/* Custom Meta Tags */}
      {customMetaTags.map((tag, index) => (
        <meta key={index} name={tag.name} content={tag.content} />
      ))}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:site_name" content="EcomBuildr" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalOgImage} />
      <meta name="twitter:site" content="@ecombuildr" />
      
      {/* Additional SEO Tags */}
      
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