import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  // User-provided data (from database)
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
  siteName?: string;
  ogType?: string;
  
  // Control flag
  useUserData?: boolean; // If true, don't use platform defaults
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  ogImage,
  socialImageUrl,
  keywords = [],
  canonical,
  noIndex = false,
  author,
  languageCode = 'en',
  metaRobots = 'index,follow',
  customMetaTags = [],
  siteName,
  ogType = 'website',
  useUserData = false
}) => {
  const currentUrl = canonical || (typeof window !== 'undefined' ? window.location.href : '');
  
  // Platform defaults (only used when useUserData is false)
  const platformDefaults = {
    title: 'EcomBuildr - Build Your E-commerce Empire in Minutes',
    description: 'Create professional e-commerce stores with our no-code platform. Build websites, funnels, and conversion systems that turn visitors into customers.',
    ogImage: 'https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-og-image_default.jpg',
    siteName: 'EcomBuildr',
    keywords: ['ecommerce builder', 'online store', 'no code', 'bangladesh ecommerce']
  };

  // Use user data if provided, otherwise fall back to platform defaults (only if useUserData is false)
  const finalTitle = title || (!useUserData ? platformDefaults.title : '');
  const finalDescription = description || (!useUserData ? platformDefaults.description : '');
  const finalOgImage = socialImageUrl || ogImage || (!useUserData ? platformDefaults.ogImage : '');
  const finalSiteName = siteName || (!useUserData ? platformDefaults.siteName : '');
  const finalKeywords = keywords.length > 0 ? keywords : (!useUserData ? platformDefaults.keywords : []);
  
  const keywordsString = finalKeywords.length > 0 ? finalKeywords.join(', ') : '';

  useEffect(() => {
    // Update document title
    if (finalTitle) {
      document.title = finalTitle;
    }
  }, [finalTitle]);

  // Don't render anything if no user data and useUserData is true
  if (useUserData && !title && !description) {
    return null;
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      {finalTitle && <title>{finalTitle}</title>}
      {finalDescription && <meta name="description" content={finalDescription} />}
      {keywordsString && <meta name="keywords" content={keywordsString} />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      
      {/* Canonical URL */}
      {currentUrl && <link rel="canonical" href={currentUrl} />}
      
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
      <meta property="og:type" content={ogType} />
      {currentUrl && <meta property="og:url" content={currentUrl} />}
      {finalTitle && <meta property="og:title" content={finalTitle} />}
      {finalDescription && <meta property="og:description" content={finalDescription} />}
      {finalOgImage && <meta property="og:image" content={finalOgImage} />}
      {finalSiteName && <meta property="og:site_name" content={finalSiteName} />}
      <meta property="og:locale" content={`${languageCode}_US`} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {currentUrl && <meta name="twitter:url" content={currentUrl} />}
      {finalTitle && <meta name="twitter:title" content={finalTitle} />}
      {finalDescription && <meta name="twitter:description" content={finalDescription} />}
      {finalOgImage && <meta name="twitter:image" content={finalOgImage} />}
      {finalOgImage && <meta name="twitter:image:alt" content={finalTitle || ''} />}
      {!useUserData && <meta name="twitter:site" content="@ecombuildr" />}
      
      {/* Structured Data - only for platform pages */}
      {!useUserData && finalDescription && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "EcomBuildr",
            "url": "https://ecombuildr.com",
            "logo": "https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-logo-big_vifrmg.png",
            "description": finalDescription,
            "sameAs": [
              "https://facebook.com/ecombuildr",
              "https://twitter.com/ecombuildr"
            ]
          })}
        </script>
      )}
    </Helmet>
  );
};