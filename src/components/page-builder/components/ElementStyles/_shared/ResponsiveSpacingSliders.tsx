import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { useDevicePreview } from '../../contexts/DevicePreviewContext';

interface SpacingValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ResponsiveSpacing {
  desktop: SpacingValues;
  tablet: SpacingValues;
  mobile: SpacingValues;
}

interface ResponsiveSpacingSlidersProps {
  marginByDevice?: ResponsiveSpacing;
  paddingByDevice?: ResponsiveSpacing;
  onMarginChange: (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => void;
  onPaddingChange: (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => void;
}

export const ResponsiveSpacingSliders: React.FC<ResponsiveSpacingSlidersProps> = ({
  marginByDevice,
  paddingByDevice,
  onMarginChange,
  onPaddingChange
}) => {
  const { deviceType: responsiveTab, setDeviceType: setResponsiveTab } = useDevicePreview();

  // Get current spacing values with proper defaults and inheritance
  const getCurrentSpacing = (spacingByDevice?: ResponsiveSpacing, type: 'margin' | 'padding' = 'margin'): SpacingValues => {
    if (!spacingByDevice) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    // Current device value
    const currentValue = spacingByDevice[responsiveTab];
    if (currentValue) {
      return currentValue;
    }

    // Inheritance logic: mobile -> tablet -> desktop
    if (responsiveTab === 'mobile') {
      const tabletValue = spacingByDevice.tablet;
      if (tabletValue) {
        return tabletValue;
      }
    }
    
    if (responsiveTab === 'mobile' || responsiveTab === 'tablet') {
      const desktopValue = spacingByDevice.desktop;
      if (desktopValue) {
        return desktopValue;
      }
    }

    return { top: 0, right: 0, bottom: 0, left: 0 };
  };

  const currentMargin = getCurrentSpacing(marginByDevice, 'margin');
  const currentPadding = getCurrentSpacing(paddingByDevice, 'padding');

  const clampNumber = (value: number): number => {
    return Math.max(0, Math.min(200, value));
  };

  const handleMarginChange = (property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    onMarginChange(responsiveTab, property, clampNumber(value));
  };

  const handlePaddingChange = (property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    onPaddingChange(responsiveTab, property, clampNumber(value));
  };

  const handleInputChange = (property: string, value: string, type: 'margin' | 'padding') => {
    const numValue = clampNumber(parseInt(value) || 0);
    const spacingProperty = property.replace(type, '').toLowerCase() as 'top' | 'right' | 'bottom' | 'left';
    
    if (type === 'margin') {
      handleMarginChange(spacingProperty, numValue);
    } else {
      handlePaddingChange(spacingProperty, numValue);
    }
  };

  const SpacingControl = ({ 
    label, 
    value, 
    onChange, 
    type 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void; 
    type: 'margin' | 'padding';
  }) => (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={([newValue]) => onChange(newValue)}
          max={200}
          step={1}
          className="w-full"
        />
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(`${type}${label}`, e.target.value, type)}
            className="h-8 w-16 text-xs"
            min={0}
            max={200}
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Device Selector */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <Button
          variant={responsiveTab === 'desktop' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setResponsiveTab('desktop')}
          className="h-8 px-2"
        >
          <Monitor className="h-3 w-3" />
        </Button>
        <Button
          variant={responsiveTab === 'tablet' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setResponsiveTab('tablet')}
          className="h-8 px-2"
        >
          <Tablet className="h-3 w-3" />
        </Button>
        <Button
          variant={responsiveTab === 'mobile' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setResponsiveTab('mobile')}
          className="h-8 px-2"
        >
          <Smartphone className="h-3 w-3" />
        </Button>
      </div>

      {/* Margin Controls */}
      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Margin</Label>
        <div className="grid grid-cols-2 gap-3">
          <SpacingControl
            label="Top"
            value={currentMargin.top}
            onChange={(value) => handleMarginChange('top', value)}
            type="margin"
          />
          <SpacingControl
            label="Right"
            value={currentMargin.right}
            onChange={(value) => handleMarginChange('right', value)}
            type="margin"
          />
          <SpacingControl
            label="Bottom"
            value={currentMargin.bottom}
            onChange={(value) => handleMarginChange('bottom', value)}
            type="margin"
          />
          <SpacingControl
            label="Left"
            value={currentMargin.left}
            onChange={(value) => handleMarginChange('left', value)}
            type="margin"
          />
        </div>
      </div>

      {/* Padding Controls */}
      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Padding</Label>
        <div className="grid grid-cols-2 gap-3">
          <SpacingControl
            label="Top"
            value={currentPadding.top}
            onChange={(value) => handlePaddingChange('top', value)}
            type="padding"
          />
          <SpacingControl
            label="Right"
            value={currentPadding.right}
            onChange={(value) => handlePaddingChange('right', value)}
            type="padding"
          />
          <SpacingControl
            label="Bottom"
            value={currentPadding.bottom}
            onChange={(value) => handlePaddingChange('bottom', value)}
            type="padding"
          />
          <SpacingControl
            label="Left"
            value={currentPadding.left}
            onChange={(value) => handlePaddingChange('left', value)}
            type="padding"
          />
        </div>
      </div>
    </div>
  );
};
