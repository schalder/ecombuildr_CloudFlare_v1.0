import { Route, Routes } from 'react-router-dom';
import { MemberAuthProvider } from '@/hooks/useMemberAuth';
import MemberLogin from '@/pages/MemberLogin';
import MemberDashboard from '@/pages/MemberDashboard';
import CourseMemberDashboard from '@/components/course/CourseMemberDashboard';
import CoursePlayerPage from '@/pages/CoursePlayerPage';
import CourseMemberLoginPage from '@/pages/CourseMemberLoginPage';
import CoursePaymentProcessing from '@/components/course/CoursePaymentProcessing';

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
      <Route path="/courses/payment-processing" element={<CoursePaymentProcessing />} />
    </Routes>
  );
};

export default MemberRoutes;