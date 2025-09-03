import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageBuilderElement } from '../../../types';
import { 
  getEffectiveResponsiveValue, 
  hasResponsiveOverride, 
  getInheritanceSource, 
  getInheritanceLabel,
  clearResponsiveOverride,
  setResponsiveOverride
} from '../../../utils/responsiveHelpers';

interface ResponsiveStyleControlProps {
  element: PageBuilderElement;
  property: string;
  label: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  fallback?: any;
  onStyleUpdate: (property: string, value: any) => void;
  children: (value: any, onChange: (value: any) => void, isInherited: boolean) => React.ReactNode;
}

export const ResponsiveStyleControl: React.FC<ResponsiveStyleControlProps> = ({
  element,
  property,
  label,
  deviceType,
  fallback = '',
  onStyleUpdate,
  children
}) => {
  const effectiveValue = getEffectiveResponsiveValue(element, property, deviceType, fallback);
  const hasOverride = hasResponsiveOverride(element, property, deviceType);
  const inheritanceSource = getInheritanceSource(element, property, deviceType);
  const inheritanceLabel = getInheritanceLabel(inheritanceSource);
  const isInherited = inheritanceSource !== 'current' && inheritanceSource !== null;

  const handleChange = (value: any) => {
    setResponsiveOverride(element, property, value, deviceType, onStyleUpdate);
  };

  const handleClear = () => {
    clearResponsiveOverride(element, property, deviceType, onStyleUpdate);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-xs">{label}</Label>
          {/* Inheritance indicator removed - was confusing to users */}
        </div>
        {hasOverride && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleClear}
            className="h-6 px-2"
            title="Reset to inherit"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {children(effectiveValue, handleChange, isInherited)}
    </div>
  );
};

interface ResponsiveTabsProps {
  activeTab: 'desktop' | 'tablet' | 'mobile';
  onTabChange: (tab: 'desktop' | 'tablet' | 'mobile') => void;
}

export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <Label className="text-xs">Device</Label>
      <div className="flex space-x-1">
        <Button
          size="sm"
          variant={activeTab === 'desktop' ? 'default' : 'outline'}
          onClick={() => onTabChange('desktop')}
        >
          <Monitor className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'tablet' ? 'default' : 'outline'}
          onClick={() => onTabChange('tablet')}
        >
          <Tablet className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'mobile' ? 'default' : 'outline'}
          onClick={() => onTabChange('mobile')}
        >
          <Smartphone className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};