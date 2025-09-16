import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
  siteName?: string;
  locale?: string;
  robots?: string;
  canonical?: string;
  favicon?: string;
  structuredData?: Record<string, any> | Record<string, any>[];
  customMetaTags?: { name: string; content: string }[];
}

// Helper function to strip HTML and extract meaningful text
const stripHtmlAndExtract = (html: string, maxLength: number = 155): string => {
  if (!html) return '';
  
  // Remove HTML tags
  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities
  const decoded = withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  
  // Clean up whitespace and split into sentences
  const sentences = decoded
    .replace(/\s+/g, ' ')
    .trim()
    .split(/[.!?]+/)
    .filter(sentence => sentence.trim().length > 0);
  
  if (sentences.length === 0) return '';
  
  let result = sentences[0].trim();
  let currentLength = result.length;
  
  // Add more sentences if they fit
  for (let i = 1; i < sentences.length && currentLength < maxLength - 20; i++) {
    const nextSentence = sentences[i].trim();
    if (currentLength + nextSentence.length + 2 <= maxLength) {
      result += '. ' + nextSentence;
      currentLength = result.length;
    } else {
      break;
    }
  }
  
  // Ensure proper ending
  if (!result.match(/[.!?]$/)) {
    result += '.';
  }
  
  return result.length > maxLength ? result.substring(0, maxLength - 3) + '...' : result;
};

export const MetaTags: React.FC<MetaTagsProps> = ({
  title = 'EcomBuildr - Build Your E-commerce Empire in Minutes',
  description = 'Create professional e-commerce stores with our no-code platform. Build websites, funnels, and conversion systems that turn visitors into customers.',
  image = 'https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-og-image_default.jpg',
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  keywords = [],
  siteName = 'EcomBuildr',
  locale = 'en_US',
  robots = 'index,follow',
  canonical,
  favicon,
  structuredData,
  customMetaTags = []
}) => {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const canonicalUrl = canonical || currentUrl;
  const keywordsString = keywords.length > 0 ? keywords.join(', ') : 'ecommerce builder, online store, no code, bangladesh ecommerce';
  
  // Process description to ensure it's meaningful
  const processedDescription = stripHtmlAndExtract(description, 155);

  useEffect(() => {
    // Update document title
    document.title = title;
  }, [title]);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={processedDescription} />
      <meta name="keywords" content={keywordsString} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Robots */}
      <meta name="robots" content={robots} />
      
      {/* Author */}
      {author && <meta name="author" content={author} />}
      
      {/* Language */}
      <meta name="language" content={locale.split('_')[0]} />
      
      {/* Custom Meta Tags */}
      {customMetaTags.map((tag, index) => (
        <meta key={index} name={tag.name} content={tag.content} />
      ))}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={processedDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Article-specific Open Graph */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={processedDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@ecombuildr" />
      
      {/* Additional SEO Tags */}
      <meta name="theme-color" content="#10B981" />
      
      {/* Favicon */}
      {favicon && (
        <>
          <link rel="icon" type="image/png" href={favicon} />
          <link rel="shortcut icon" type="image/png" href={favicon} />
        </>
      )}
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Default Organization Schema if no custom structured data */}
      {!structuredData && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": type === 'article' ? "Article" : type === 'product' ? "Product" : "Organization",
            "name": type === 'article' || type === 'product' ? title : siteName,
            "url": currentUrl,
            "description": processedDescription,
            "image": image,
            ...(type === 'article' && {
              "headline": title,
              "datePublished": publishedTime,
              "dateModified": modifiedTime,
              "author": {
                "@type": "Person",
                "name": author
              }
            }),
            ...(type === 'product' && {
              "brand": siteName,
              "offers": {
                "@type": "Offer",
                "availability": "https://schema.org/InStock"
              }
            }),
            ...(type === 'website' && {
              "sameAs": [
                "https://facebook.com/ecombuildr",
                "https://twitter.com/ecombuildr"
              ]
            })
          })}
        </script>
      )}
    </Helmet>
  );
};

// Utility function to generate content-aware descriptions
export const generateDescriptionFromContent = (content: any): string => {
  if (!content) return '';
  
  try {
    // Handle different content structures
    if (typeof content === 'string') {
      return stripHtmlAndExtract(content);
    }
    
    if (content.sections && Array.isArray(content.sections)) {
      // Extract text from page builder sections
      const textContent = content.sections
        .map((section: any) => {
          if (section.type === 'text' || section.type === 'paragraph') {
            return section.content || section.text || '';
          }
          if (section.type === 'heading') {
            return section.content || section.text || '';
          }
          if (section.blocks && Array.isArray(section.blocks)) {
            return section.blocks
              .map((block: any) => block.content || block.text || '')
              .join(' ');
          }
          return '';
        })
        .join(' ');
      
      return stripHtmlAndExtract(textContent);
    }
    
    // Handle other content structures
    const str = JSON.stringify(content);
    return stripHtmlAndExtract(str);
  } catch (error) {
    console.warn('Error generating description from content:', error);
    return '';
  }
};