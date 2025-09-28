import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter';
import { StoreProvider, useStore } from '@/contexts/StoreContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

interface CourseStorefrontLayoutProps {
  children: React.ReactNode;
}

const CourseStorefrontContent: React.FC<CourseStorefrontLayoutProps> = ({ children }) => {
  const { storeId, courseId } = useParams<{ storeId?: string; courseId?: string }>();
  const { store, loading, error, loadStoreById } = useStore();

  console.log('CourseStorefrontContent Debug:', { storeId, courseId, store, loading, error });

  useEffect(() => {
    const initializeStore = async () => {
      // If we have a storeId param, use it directly
      if (storeId && !store && !loading && !error) {
        console.log('Loading store by ID from params:', storeId);
        loadStoreById(storeId);
        return;
      }

      // If no storeId but we have courseId, get storeId from course
      if (!storeId && courseId && !store && !loading && !error) {
        console.log('Getting store ID from course:', courseId);
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data, error: courseError } = await supabase
            .from('courses')
            .select('store_id')
            .eq('id', courseId)
            .maybeSingle();

          if (courseError) {
            console.error('Error fetching course store:', courseError);
            return;
          }

          if (data?.store_id) {
            console.log('Loading store by ID from course:', data.store_id);
            loadStoreById(data.store_id);
          }
        } catch (err) {
          console.error('Error in store initialization:', err);
        }
      }
    };

    initializeStore();
  }, [storeId, courseId, store, loading, error, loadStoreById]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Store Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />
      <main>
        {children}
      </main>
      <StorefrontFooter />
    </div>
  );
};

export const CourseStorefrontLayout: React.FC<CourseStorefrontLayoutProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <CourseStorefrontContent>
          {children}
        </CourseStorefrontContent>
      </StoreProvider>
    </ErrorBoundary>
  );
};