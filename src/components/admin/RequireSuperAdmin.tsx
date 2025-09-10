import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function RequireSuperAdmin() {
  const { user, loading: authLoading } = useAuth();

  // Query to check if user is super admin
  const { data: isSuperAdmin, isLoading: adminCheckLoading, error } = useQuery({
    queryKey: ['is-super-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase.rpc('is_super_admin');
      if (error) {
        console.error('Error checking super admin status:', error);
        return false;
      }
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Show loading while checking auth or admin status
  if (authLoading || (user && adminCheckLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if not super admin or if there was an error
  if (!isSuperAdmin || error) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  // User is authenticated and is super admin
  return <Outlet />;
}