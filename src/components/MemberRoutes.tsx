import { Route, Routes } from 'react-router-dom';
import { MemberAuthProvider } from '@/hooks/useMemberAuth';
import MemberLogin from '@/pages/MemberLogin';
import MemberDashboard from '@/pages/MemberDashboard';

const MemberRoutes = () => {
  return (
    <MemberAuthProvider>
      <Routes>
        <Route path="/members/:storeSlug/login" element={<MemberLogin />} />
        <Route path="/members/:storeSlug/dashboard" element={<MemberDashboard />} />
      </Routes>
    </MemberAuthProvider>
  );
};

export default MemberRoutes;