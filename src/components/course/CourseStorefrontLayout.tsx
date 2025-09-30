import React from 'react';
import { CourseHeader } from './CourseHeader';
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter';

interface CourseStorefrontLayoutProps {
  children: React.ReactNode;
}

export const CourseStorefrontLayout: React.FC<CourseStorefrontLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <CourseHeader />
      <main>
        {children}
      </main>
      <StorefrontFooter />
    </div>
  );
};