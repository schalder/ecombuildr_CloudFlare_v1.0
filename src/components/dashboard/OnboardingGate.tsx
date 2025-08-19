import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { useStoreWebsites } from '@/hooks/useStoreWebsites';
import { useStoreFunnels } from '@/hooks/useStoreFunnels';

export function OnboardingGate() {
  const { user, loading: authLoading } = useAuth();
  const { store, loading: storeLoading } = useUserStore();
  const { websites, loading: websitesLoading } = useStoreWebsites(store?.id || '');
  const { funnels, loading: funnelsLoading } = useStoreFunnels(store?.id || '');
  const location = useLocation();

  // Debug logging
  console.log('OnboardingGate Debug:', {
    authLoading,
    storeLoading,
    websitesLoading,
    funnelsLoading,
    store: !!store,
    websitesCount: websites?.length || 0,
    funnelsCount: funnels?.length || 0,
    pathname: location.pathname
  });

  // Redirect if not authenticated
  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking authentication, store, websites, or funnels
  if (authLoading || storeLoading || websitesLoading || funnelsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't interfere with create pages
  if (location.pathname === '/dashboard/websites/create' || location.pathname === '/dashboard/funnels/create') {
    return <Outlet />;
  }

  // Ensure we have a store first
  if (!store) {
    return <Navigate to="/dashboard/websites/create" replace />;
  }

  // Only redirect if user genuinely has no websites AND no funnels
  // Make sure loading is complete before checking
  if (!websitesLoading && !funnelsLoading && websites.length === 0 && funnels.length === 0) {
    return <Navigate to="/dashboard/websites/create" replace />;
  }

  // User is authenticated and has websites or funnels, proceed normally
  return <Outlet />;
}