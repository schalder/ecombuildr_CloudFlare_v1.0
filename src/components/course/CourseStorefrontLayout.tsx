import React from 'react';
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter';

interface CourseStorefrontLayoutProps {
  children: React.ReactNode;
}

export const CourseStorefrontLayout: React.FC<CourseStorefrontLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <main>
        {children}
      </main>
      <StorefrontFooter />
    </div>
  );
};