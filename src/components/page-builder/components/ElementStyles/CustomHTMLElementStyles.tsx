import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';
import { ResponsiveSpacingSliders } from './_shared/ResponsiveSpacingSliders';

interface CustomHTMLElementStylesProps {
  styles: any;
  onStyleUpdate: (property: string, value: any) => void;
  deviceType: 'desktop' | 'tablet' | 'mobile';
}

export const CustomHTMLElementStyles: React.FC<CustomHTMLElementStylesProps> = ({
  styles,
  onStyleUpdate,
  deviceType
}) => {
  const currentStyles = styles?.[deviceType] || {};
  const [spacingOpen, setSpacingOpen] = React.useState(true);

  const handleSpacingChange = (property: string, value: number) => {
    onStyleUpdate(deviceType, {
      ...currentStyles,
      [property]: `${value}px`
    });
  };

  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', '')) || 0;
  };

  // Helper functions for device-aware spacing conversion
  const getCurrentSpacingByDevice = () => {
    const marginByDevice = styles?.marginByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    
    const paddingByDevice = styles?.paddingByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };

    // Convert legacy spacing to device-aware if needed
    if (!styles?.marginByDevice && (currentStyles.marginTop || currentStyles.marginRight || currentStyles.marginBottom || currentStyles.marginLeft)) {
      marginByDevice[deviceType] = {
        top: parsePixelValue(currentStyles.marginTop),
        right: parsePixelValue(currentStyles.marginRight),
        bottom: parsePixelValue(currentStyles.marginBottom),
        left: parsePixelValue(currentStyles.marginLeft)
      };
    }

    if (!styles?.paddingByDevice && (currentStyles.paddingTop || currentStyles.paddingRight || currentStyles.paddingBottom || currentStyles.paddingLeft)) {
      paddingByDevice[deviceType] = {
        top: parsePixelValue(currentStyles.paddingTop),
        right: parsePixelValue(currentStyles.paddingRight),
        bottom: parsePixelValue(currentStyles.paddingBottom),
        left: parsePixelValue(currentStyles.paddingLeft)
      };
    }

    return { marginByDevice, paddingByDevice };
  };

  const handleMarginChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const { marginByDevice } = getCurrentSpacingByDevice();
    const updated = { ...marginByDevice };
    updated[device] = { ...updated[device], [property]: value };
    onStyleUpdate('marginByDevice', updated);
  };

  const handlePaddingChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const { paddingByDevice } = getCurrentSpacingByDevice();
    const updated = { ...paddingByDevice };
    updated[device] = { ...updated[device], [property]: value };
    onStyleUpdate('paddingByDevice', updated);
  };

  return (
    <div className="space-y-4">
      <CollapsibleGroup title="Spacing" isOpen={spacingOpen} onToggle={setSpacingOpen}>
        <ResponsiveSpacingSliders
          marginByDevice={getCurrentSpacingByDevice().marginByDevice}
          paddingByDevice={getCurrentSpacingByDevice().paddingByDevice}
          onMarginChange={handleMarginChange}
          onPaddingChange={handlePaddingChange}
        />
      </CollapsibleGroup>
    </div>
  );
};