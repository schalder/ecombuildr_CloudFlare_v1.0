import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { useStoreWebsites } from '@/hooks/useStoreWebsites';

export function OnboardingGate() {
  const { user, loading: authLoading } = useAuth();
  const { store, loading: storeLoading } = useUserStore();
  const { websites, loading: websitesLoading } = useStoreWebsites(store?.id || '');
  const location = useLocation();

  // Redirect if not authenticated
  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking authentication or store
  if (authLoading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't interfere with the create website page itself
  if (location.pathname === '/dashboard/websites/create') {
    return <Outlet />;
  }

  // If user has no store or no websites, redirect to create website page
  if (!store || (!websitesLoading && websites.length === 0)) {
    return <Navigate to="/dashboard/websites/create" replace />;
  }

  // User is authenticated and has websites, proceed normally
  return <Outlet />;
}