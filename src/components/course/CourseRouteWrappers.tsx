import React from 'react';
import { useParams } from 'react-router-dom';
import StorefrontCourseDetail from '@/components/storefront/StorefrontCourseDetail';
import StorefrontCourseCheckout from '@/components/course/StorefrontCourseCheckout';

export const StorefrontCourseDetailWrapper: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  
  if (!courseId) {
    return <div>Course ID not found</div>;
  }
  
  return <StorefrontCourseDetail courseId={courseId} />;
};

export const StorefrontCourseCheckoutWrapper: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  
  if (!courseId) {
    return <div>Course ID not found</div>;
  }
  
  return <StorefrontCourseCheckout courseId={courseId} />;
};