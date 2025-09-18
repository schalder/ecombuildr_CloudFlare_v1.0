import { Route, Routes } from 'react-router-dom';
import { MemberAuthProvider } from '@/hooks/useMemberAuth';
import MemberLogin from '@/pages/MemberLogin';
import MemberDashboard from '@/pages/MemberDashboard';
import CourseMemberDashboard from '@/components/course/CourseMemberDashboard';
import CoursePlayerPage from '@/pages/CoursePlayerPage';
import CourseMemberLoginPage from '@/pages/CourseMemberLoginPage';

const MemberRoutes = () => {
  return (
    <Routes>
      {/* Store-specific member routes */}
      <Route path="/members/:storeSlug/login" element={
        <MemberAuthProvider>
          <MemberLogin />
        </MemberAuthProvider>
      } />
      <Route path="/members/:storeSlug/dashboard" element={
        <MemberAuthProvider>
          <MemberDashboard />
        </MemberAuthProvider>
      } />
      
      {/* Course-specific member routes */}
      <Route path="/courses/members/login" element={<CourseMemberLoginPage />} />
      <Route path="/courses/members" element={
        <MemberAuthProvider>
          <CourseMemberDashboard />
        </MemberAuthProvider>
      } />
      <Route path="/courses/learn/:courseId" element={<CoursePlayerPage />} />
    </Routes>
  );
};

export default MemberRoutes;