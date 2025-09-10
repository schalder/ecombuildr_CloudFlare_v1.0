import React from 'react';
import { PageBuilderData } from '@/components/page-builder/types';
import { DeviceType } from '@/components/page-builder/utils/responsive';

interface LazyPageBuilderProps {
  data: PageBuilderData;
  className?: string;
  deviceType?: DeviceType;
}

// Lazy load the page builder renderer to reduce initial bundle size
const OptimizedPageBuilderRenderer = React.lazy(() => 
  import('./OptimizedPageBuilderRenderer').then(module => ({ 
    default: module.OptimizedPageBuilderRenderer 
  }))
);

export const LazyPageBuilder: React.FC<LazyPageBuilderProps> = (props) => {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">Loading content...</div>
      </div>
    }>
      <OptimizedPageBuilderRenderer {...props} />
    </React.Suspense>
  );
};