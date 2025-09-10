import React from 'react';
import { PageBuilderData } from '@/components/page-builder/types';
import { DeviceType } from '@/components/page-builder/utils/responsive';
import { LazyPageBuilder } from './LazyPageBuilder';
import { useWebVitals } from '@/hooks/useWebVitals';

interface PageBuilderRendererProps {
  data: PageBuilderData;
  className?: string;
  deviceType?: DeviceType;
}

export const PageBuilderRenderer: React.FC<PageBuilderRendererProps> = ({ 
  data, 
  className = '',
  deviceType: propDeviceType
}) => {
  // Track web vitals for performance monitoring
  useWebVitals();

  // Use the lazy-loaded optimized renderer for better performance
  return (
    <LazyPageBuilder 
      data={data}
      className={className}
      deviceType={propDeviceType}
    />
  );
};