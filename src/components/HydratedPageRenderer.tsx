import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';

interface HydratedPageRendererProps {
  children?: React.ReactNode;
}

export function HydratedPageRenderer({ children }: HydratedPageRendererProps) {
  const [hydrationData, setHydrationData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for hydration data from server-rendered HTML
    if (window.__HYDRATION_DATA__) {
      const data = window.__HYDRATION_DATA__;
      console.log('🔍 Found hydration data:', data);
      
      setHydrationData(data);
      
      // Clear hydration data after use to prevent issues
      delete window.__HYDRATION_DATA__;
      
      // If we're on the root path but have content data, navigate to appropriate route
      if (location.pathname === '/' && data.contentType && data.contentId) {
        const targetPath = getNavigationPath(data.contentType, data.contentId);
        if (targetPath && targetPath !== '/') {
          navigate(targetPath, { replace: true });
        }
      }
    }
  }, [navigate, location.pathname]);

  // If we have hydration data, render the page content directly
  if (hydrationData?.pageData) {
    return (
      <div className="hydrated-page">
        <PageBuilderRenderer 
          data={{ sections: hydrationData.pageData.sections || [] }}
        />
      </div>
    );
  }

  // Otherwise render children normally
  return <>{children}</>;
}

function getNavigationPath(contentType: string, contentId: string): string {
  switch (contentType) {
    case 'website_page':
      return `/website/${contentId}`;
    case 'funnel_step':
      return `/funnel/${contentId}`;
    default:
      return '/';
  }
}
