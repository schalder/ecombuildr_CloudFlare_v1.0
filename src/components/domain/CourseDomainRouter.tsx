import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { MemberAuthProvider } from '@/hooks/useMemberAuth';
import CourseLibrary from '@/pages/CourseLibrary';
import CourseDetail from '@/pages/CourseDetail';
import MemberLogin from '@/pages/MemberLogin';
import MemberDashboard from '@/pages/MemberDashboard';
import { Loader2 } from 'lucide-react';

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

  // Determine which page to show based on the path
  if (coursePath === basePath || coursePath === `${basePath}/`) {
    return <CourseLibrary />;
  }

  if (coursePath.startsWith(`${basePath}/members`) || coursePath.startsWith('/members')) {
    return (
      <MemberAuthProvider>
        <Routes>
          <Route path="/members/login" element={<MemberLogin />} />
          <Route path="/members/dashboard" element={<MemberDashboard />} />
          <Route path="/members" element={<MemberDashboard />} />
        </Routes>
      </MemberAuthProvider>
    );
  }

  if (coursePath.startsWith(`${basePath}/courses/`) || coursePath.startsWith('/courses/')) {
    const courseSlugMatch = coursePath.match(/\/courses\/([^/]+)/);
    if (courseSlugMatch) {
      const courseSlug = courseSlugMatch[1];
      return <CourseDetailWrapper courseSlug={courseSlug} />;
    }
  }

  // Default to course library
  return <CourseLibrary />;
};

const CourseDetailWrapper = ({ courseSlug }: { courseSlug: string }) => {
  const [courseId, setCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseBySlug = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id')
          .eq('slug', courseSlug)
          .eq('is_published', true)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          console.error('Course not found:', error);
          setCourseId(null);
        } else {
          setCourseId(data.id);
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

  return <CourseDetail />;
};

export default CourseDomainRouter;