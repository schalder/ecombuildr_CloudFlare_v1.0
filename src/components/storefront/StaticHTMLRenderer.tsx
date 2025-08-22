import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageBuilderRenderer } from './PageBuilderRenderer';

interface StaticHTMLRendererProps {
  contentType: 'website' | 'funnel';
  contentId: string;
  customDomain?: string;
  fallbackComponent?: React.ReactNode;
  className?: string;
}

export const StaticHTMLRenderer: React.FC<StaticHTMLRendererProps> = ({
  contentType,
  contentId,
  customDomain,
  fallbackComponent,
  className = ''
}) => {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaticHTML = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Query for static HTML snapshot
        let query = supabase
          .from('html_snapshots')
          .select('html_content, generated_at')
          .eq('content_type', contentType)
          .eq('content_id', contentId);

        if (customDomain) {
          query = query.eq('custom_domain', customDomain);
        } else {
          query = query.is('custom_domain', null);
        }

        const { data, error } = await query
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching static HTML:', error);
          setError(error.message);
          return;
        }

        if (data?.html_content) {
          
          setHtmlContent(data.html_content);
        } else {
          
          setHtmlContent(null);
        }

      } catch (err) {
        console.error('Error fetching static HTML:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaticHTML();
  }, [contentType, contentId, customDomain]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading page...</p>
        </div>
      </div>
    );
  }

  // Show error state (fallback to React component)
  if (error) {
    console.warn('StaticHTMLRenderer error, falling back to React component:', error);
    return fallbackComponent ? <>{fallbackComponent}</> : null;
  }

  // If we have static HTML, render it directly
  if (htmlContent) {
    return (
      <div 
        className={`static-html-content ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  // Fallback to React component if no static HTML
  return fallbackComponent ? <>{fallbackComponent}</> : null;
};

export default StaticHTMLRenderer;