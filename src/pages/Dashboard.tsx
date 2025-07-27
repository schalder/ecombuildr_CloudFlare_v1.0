import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardOverview from './DashboardOverview';

const Dashboard = () => {
  const { user, loading } = useAuth();

  // Redirect if not authenticated
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  return <DashboardOverview />;
};

export default Dashboard;