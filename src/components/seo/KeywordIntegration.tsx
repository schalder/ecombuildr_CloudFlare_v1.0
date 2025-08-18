import React from 'react';

interface KeywordIntegrationProps {
  keywords: string[];
  content?: string;
  className?: string;
}

/**
 * Naturally integrates keywords into page content for better SEO
 */
export const KeywordIntegration: React.FC<KeywordIntegrationProps> = ({
  keywords,
  content,
  className = ''
}) => {
  if (!keywords.length) return null;

  const generateSEOText = (keywords: string[], content?: string) => {
    if (content && content.length > 100) {
      // If we have substantial content, just add keywords naturally
      const primaryKeyword = keywords[0];
      if (!content.toLowerCase().includes(primaryKeyword.toLowerCase())) {
        return `${content} Our ${primaryKeyword} solutions are designed to meet your needs.`;
      }
      return content;
    }

    // Generate keyword-rich content if no substantial content exists
    const primaryKeywords = keywords.slice(0, 3);
    return `Discover our premium ${primaryKeywords.join(', ')} services. We specialize in providing high-quality ${keywords[0]} solutions that deliver exceptional results. Whether you're looking for ${keywords[1] || 'professional services'} or ${keywords[2] || 'expert guidance'}, we have the expertise and experience to help you succeed.`;
  };

  const seoText = generateSEOText(keywords, content);

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <p className="text-muted-foreground leading-relaxed">
        {seoText}
      </p>
      
      {/* Hidden keyword density for crawlers */}
      <div className="sr-only">
        <h2>Related Topics</h2>
        <ul>
          {keywords.map((keyword, index) => (
            <li key={index}>{keyword}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/**
 * Hook to generate keyword-rich alt text for images
 */
export const useKeywordAltText = (baseAlt: string, keywords: string[]) => {
  return React.useMemo(() => {
    if (!keywords.length) return baseAlt;
    
    const primaryKeyword = keywords[0];
    if (baseAlt.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      return baseAlt;
    }
    
    return `${baseAlt} - ${primaryKeyword}`;
  }, [baseAlt, keywords]);
};