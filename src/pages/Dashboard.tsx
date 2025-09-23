import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const { user, loading, isLoggingOut } = useAuth();

  // Redirect if not authenticated (but not during logout process)
  if (!user && !loading && !isLoggingOut) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while authentication is being verified
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <Outlet />;
};

export default Dashboard;