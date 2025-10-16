import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  socialImageUrl?: string;
  keywords?: string[];
  robots?: string;
  author?: string;
  languageCode?: string;
  customMetaTags?: { name: string; content: string }[];
  siteName?: string;
  ogType?: string;
  locale?: string;
  favicon?: string;
  structuredData?: Record<string, any> | Record<string, any>[];
}

const SEO: React.FC<SEOProps> = ({
  title = 'EcomBuildr - Build Your E-commerce Empire',
  description = 'Create stunning e-commerce websites and sales funnels with our drag-and-drop builder. No coding required.',
  canonical,
  image,
  socialImageUrl,
  keywords = [],
  robots = 'index, follow',
  author = 'EcomBuildr',
  languageCode = 'en',
  customMetaTags = [],
  siteName = 'EcomBuildr',
  ogType = 'website',
  locale = 'en_US',
  favicon,
  structuredData,
}) => {
  // Prioritize social image over regular image
  const finalImage = socialImageUrl || image;
  
  // Build canonical URL
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <meta name="author" content={author} />
      <meta name="language" content={languageCode} />
      
      {/* Keywords */}
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Favicon */}
      {favicon && (
        <>
          <link rel="icon" type="image/png" href={favicon} />
          <link rel="shortcut icon" type="image/png" href={favicon} />
        </>
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Open Graph Image */}
      {finalImage && (
        <>
          <meta property="og:image" content={finalImage} />
          <meta property="og:image:secure_url" content={finalImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:image:alt" content={title} />
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {finalImage && (
        <>
          <meta name="twitter:image" content={finalImage} />
          <meta name="twitter:image:alt" content={title} />
        </>
      )}
      
      {/* Custom Meta Tags */}
      {customMetaTags.map((tag, index) => (
        <meta key={index} name={tag.name} content={tag.content} />
      ))}
      
      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
