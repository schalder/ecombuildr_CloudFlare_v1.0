import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { useStoreWebsites } from '@/hooks/useStoreWebsites';
import { useStoreFunnels } from '@/hooks/useStoreFunnels';
import { usePlanLimits } from '@/hooks/usePlanLimits';

const Dashboard = () => {
  const { user, loading: authLoading, isLoggingOut } = useAuth();
  const { store, loading: storeLoading } = useUserStore();
  const { websites, loading: websitesLoading } = useStoreWebsites(store?.id || '');
  const { funnels, loading: funnelsLoading } = useStoreFunnels(store?.id || '');
  const { userProfile, loading: profileLoading } = usePlanLimits();
  const location = useLocation();

  // Redirect if not authenticated (but not during logout process)
  if (!user && !authLoading && !isLoggingOut) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while authentication is being verified
  if (authLoading || storeLoading || websitesLoading || funnelsLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't interfere with create pages or specific routes
  if (location.pathname === '/dashboard/websites/create' || 
      location.pathname === '/dashboard/funnels/create' ||
      location.pathname.includes('/dashboard/websites/') ||
      location.pathname.includes('/dashboard/funnels/')) {
    return <Outlet />;
  }

  // Always allow access to dashboard overview
  if (location.pathname === '/dashboard/overview' || location.pathname === '/dashboard') {
    return <Outlet />;
  }

  // Ensure we have a store for other dashboard routes
  if (!store) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  // For read-only users (expired trial/subscription), always show dashboard
  // Don't redirect them to create pages since they can't create anything
  if (userProfile?.account_status === 'read_only') {
    return <Outlet />;
  }

  // User is authenticated and has websites or funnels, proceed normally
  return <Outlet />;
};

export default Dashboard;