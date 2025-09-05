import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { useStoreWebsites } from '@/hooks/useStoreWebsites';
import { useStoreFunnels } from '@/hooks/useStoreFunnels';
import { usePlanLimits } from '@/hooks/usePlanLimits';

export function OnboardingGate() {
  const { user, loading: authLoading } = useAuth();
  const { store, loading: storeLoading } = useUserStore();
  const { websites, loading: websitesLoading } = useStoreWebsites(store?.id || '');
  const { funnels, loading: funnelsLoading } = useStoreFunnels(store?.id || '');
  const { userProfile, loading: profileLoading } = usePlanLimits();
  const location = useLocation();


  // Redirect if not authenticated
  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking authentication, store, websites, funnels, or profile
  if (authLoading || storeLoading || websitesLoading || funnelsLoading || profileLoading) {
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

  // For read-only users (expired trial/subscription), always show dashboard
  // Don't redirect them to create pages since they can't create anything
  if (userProfile?.account_status === 'read_only') {
    return <Outlet />;
  }

  // Only redirect if user genuinely has no websites AND no funnels
  // Make sure loading is complete before checking
  if (!websitesLoading && !funnelsLoading && websites.length === 0 && funnels.length === 0) {
    return <Navigate to="/dashboard/websites/create" replace />;
  }

  // User is authenticated and has websites or funnels, proceed normally
  return <Outlet />;
}