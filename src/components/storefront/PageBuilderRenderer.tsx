import React from 'react';
import { PageBuilderData } from '@/components/page-builder/types';
import { DeviceType } from '@/components/page-builder/utils/responsive';
import { StorefrontPageBuilder } from './renderer/StorefrontPageBuilder';
// Ensure elements are registered on storefront render too
import '@/components/page-builder/elements';

interface PageBuilderRendererProps {
  data: PageBuilderData;
  className?: string;
  deviceType?: DeviceType;
}

export const PageBuilderRenderer: React.FC<PageBuilderRendererProps> = ({ 
  data, 
  className = '',
  deviceType
}) => {
  // Use StorefrontPageBuilder as the unified renderer
  // This ensures consistent styling and behavior across all domains
  return (
    <StorefrontPageBuilder 
      data={data} 
      className={className}
      deviceType={deviceType}
    />
  );
};