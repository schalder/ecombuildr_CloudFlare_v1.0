import { Route, Routes } from 'react-router-dom';
import { MemberAuthProvider } from '@/hooks/useMemberAuth';
import MemberLogin from '@/pages/MemberLogin';
import MemberDashboard from '@/pages/MemberDashboard';
import CourseMemberDashboard from '@/components/course/CourseMemberDashboard';
import CoursePlayerPage from '@/pages/CoursePlayerPage';

const MemberRoutes = () => {
  return (
    <MemberAuthProvider>
      <Routes>
        <Route path="/members/:storeSlug/login" element={<MemberLogin />} />
        <Route path="/members/:storeSlug/dashboard" element={<MemberDashboard />} />
        <Route path="/courses/members/login" element={<MemberLogin />} />
        <Route path="/courses/members" element={<CourseMemberDashboard />} />
        <Route path="/courses/learn/:courseId" element={<CoursePlayerPage />} />
      </Routes>
    </MemberAuthProvider>
  );
};

export default MemberRoutes;