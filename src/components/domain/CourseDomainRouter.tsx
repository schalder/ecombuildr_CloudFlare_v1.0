import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { MemberAuthProvider } from '@/hooks/useMemberAuth';
import CourseLibrary from '@/pages/CourseLibrary';
import CourseDetail from '@/pages/CourseDetail';
import StorefrontCourseDetail from '@/components/storefront/StorefrontCourseDetail';
import StorefrontCourseLibrary from '@/components/storefront/StorefrontCourseLibrary';
import CourseMemberLogin from '@/components/course/CourseMemberLogin';
import CourseMemberDashboard from '@/components/course/CourseMemberDashboard';
import { WebsiteHeader } from '@/components/storefront/WebsiteHeader';
import { WebsiteFooter } from '@/components/storefront/WebsiteFooter';
import { WebsiteProvider } from '@/contexts/WebsiteContext';
import { Loader2 } from 'lucide-react';
import { setSEO } from '@/lib/seo';

interface CourseDomainRouterProps {
  customDomain: string;
  storeSlug?: string;
}

interface CourseConnection {
  id: string;
  domain_id: string;
  content_type: string;
  content_id: string;
  path: string;
  is_homepage: boolean;
}

const CourseDomainRouter = ({ customDomain, storeSlug }: CourseDomainRouterProps) => {
  const location = useLocation();
  const { loadStoreById, store: currentStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [courseConnection, setCourseConnection] = useState<CourseConnection | null>(null);
  const [website, setWebsite] = useState<any>(null);

  useEffect(() => {
    const initializeCourseArea = async () => {
      setLoading(true);
      
      try {
        // Fetch domain and course connections
        const { data: domainData, error: domainError } = await supabase
          .from('custom_domains')
          .select('id, store_id')
          .eq('domain', customDomain)
          .eq('is_verified', true)
          .eq('dns_configured', true)
          .single();

        if (domainError || !domainData) {
          console.error('Domain not found:', domainError);
          return;
        }

        // Check for course area connection
        const { data: connectionData, error: connectionError } = await supabase
          .from('domain_connections')
          .select('*')
          .eq('domain_id', domainData.id)
          .eq('content_type', 'course_area')
          .single();

        if (connectionError || !connectionData) {
          console.error('Course area not configured for this domain');
          return;
        }

        setCourseConnection(connectionData);

        // Load store data
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', domainData.store_id)
          .eq('is_active', true)
          .single();

        if (storeError || !storeData) {
          console.error('Store not found:', storeError);
          return;
        }

        await loadStoreById(domainData.store_id);

        // Set favicon for all course pages
        const { data: storeSettings } = await supabase
          .from('stores')
          .select('course_favicon_url')
          .eq('id', domainData.store_id)
          .single();

        if (storeSettings?.course_favicon_url) {
          setSEO({
            favicon: storeSettings.course_favicon_url
          });
        }

        // Also fetch website data for layout components
        const { data: websiteData, error: websiteError } = await supabase
          .from('websites')
          .select('*')
          .eq('store_id', domainData.store_id)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (!websiteError && websiteData) {
          setWebsite(websiteData);
        }
      } catch (error) {
        console.error('Error initializing course area:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeCourseArea();
  }, [customDomain, loadStoreById]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!courseConnection || !currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Course Area Not Found</h1>
          <p className="text-muted-foreground">
            This domain is not configured for courses.
          </p>
        </div>
      </div>
    );
  }

  const basePath = courseConnection.path || '';
  const coursePath = location.pathname;

  const renderWithLayout = (children: React.ReactNode) => {
    if (website) {
      return (
        <WebsiteProvider websiteId={website.id} websiteSlug={website.slug}>
          {(website.settings?.header?.enabled !== false) && <WebsiteHeader website={website} />}
          <main className="flex-1">
            {children}
          </main>
          {(website.settings?.footer?.enabled !== false) && <WebsiteFooter website={website} />}
        </WebsiteProvider>
      );
    }
    return children;
  };

  // Determine which page to show based on the path
  if (coursePath === basePath || coursePath === `${basePath}/`) {
    return renderWithLayout(<StorefrontCourseLibrary />);
  }

  if (coursePath.includes('/members')) {
    return (
      <MemberAuthProvider>
        {coursePath.includes('/login') ? <CourseMemberLogin /> : <CourseMemberDashboard />}
      </MemberAuthProvider>
    );
  }

  if (coursePath.startsWith(`${basePath}/courses/`) || coursePath.startsWith('/courses/')) {
    const courseSlugMatch = coursePath.match(/\/courses\/([^/]+)/);
    if (courseSlugMatch) {
      const courseIdOrSlug = courseSlugMatch[1];
      return renderWithLayout(<StorefrontCourseDetail courseId={courseIdOrSlug} />);
    }
  }

  // Default to course library
  return renderWithLayout(<StorefrontCourseLibrary />);
};

const CourseDetailWrapper = ({ courseSlug }: { courseSlug: string }) => {
  const [courseId, setCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseBySlug = async () => {
      try {
        // Use a simple fetch to avoid TypeScript infinite recursion issues
        const response = await fetch(`https://fhqwacmokbtbspkxjixf.supabase.co/rest/v1/courses?slug=eq.${courseSlug}&is_published=eq.true&is_active=eq.true&select=id`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM'
          }
        });
        
        const data = await response.json();
        
        if (!data || data.length === 0) {
          console.error('Course not found');
          setCourseId(null);
        } else {
          setCourseId(data[0].id);
        }

      } catch (error) {
        console.error('Error fetching course:', error);
        setCourseId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseBySlug();
  }, [courseSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
          <p className="text-muted-foreground">
            The course you're looking for doesn't exist or is not published.
          </p>
        </div>
      </div>
    );
  }

  return <StorefrontCourseDetail courseSlug={courseSlug} />;
};

export default CourseDomainRouter;