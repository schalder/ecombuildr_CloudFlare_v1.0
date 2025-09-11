import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { PageBuilderElement } from '../../../types';
import { getEffectiveResponsiveValue, setResponsiveOverride } from '../../../utils/responsiveHelpers';

interface SpacingControlProps {
  element: PageBuilderElement;
  property: string;
  label: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  fallback?: any;
  onStyleUpdate: (property: string, value: any) => void;
}

export const SpacingControl: React.FC<SpacingControlProps> = ({
  element,
  property,
  label,
  deviceType,
  fallback = '',
  onStyleUpdate
}) => {
  const effectiveValue = getEffectiveResponsiveValue(element, property, deviceType, fallback);

  const parsePixelValue = (val: string | undefined): number => {
    if (!val) return 0;
    return parseInt(val.replace('px', '')) || 0;
  };

  const handleSliderChange = (newValue: number) => {
    setResponsiveOverride(element, property, `${newValue}px`, deviceType, onStyleUpdate);
  };

  const handleInputChange = (inputValue: string) => {
    const numValue = Math.max(0, Math.min(200, parseInt(inputValue) || 0));
    setResponsiveOverride(element, property, `${numValue}px`, deviceType, onStyleUpdate);
  };

  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs w-12">{label}</Label>
      <Slider
        value={[parsePixelValue(effectiveValue)]}
        onValueChange={(val) => handleSliderChange(val[0])}
        max={200}
        step={1}
        className="flex-1"
      />
      <Input
        type="number"
        value={parsePixelValue(effectiveValue)}
        onChange={(e) => handleInputChange(e.target.value)}
        min={0}
        max={200}
        step={1}
        className="w-16 h-7 text-xs"
      />
      <span className="text-xs text-muted-foreground w-6">px</span>
    </div>
  );
};