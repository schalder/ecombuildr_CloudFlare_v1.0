import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

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

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Spacing</Label>
        <div className="space-y-4 mt-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Margin Top</Label>
              <span className="text-xs text-muted-foreground">{parsePixelValue(currentStyles.marginTop)}px</span>
            </div>
            <Slider
              value={[parsePixelValue(currentStyles.marginTop)]}
              onValueChange={(value) => handleSpacingChange('marginTop', value[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Margin Bottom</Label>
              <span className="text-xs text-muted-foreground">{parsePixelValue(currentStyles.marginBottom)}px</span>
            </div>
            <Slider
              value={[parsePixelValue(currentStyles.marginBottom)]}
              onValueChange={(value) => handleSpacingChange('marginBottom', value[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Padding Top</Label>
              <span className="text-xs text-muted-foreground">{parsePixelValue(currentStyles.paddingTop)}px</span>
            </div>
            <Slider
              value={[parsePixelValue(currentStyles.paddingTop)]}
              onValueChange={(value) => handleSpacingChange('paddingTop', value[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Padding Bottom</Label>
              <span className="text-xs text-muted-foreground">{parsePixelValue(currentStyles.paddingBottom)}px</span>
            </div>
            <Slider
              value={[parsePixelValue(currentStyles.paddingBottom)]}
              onValueChange={(value) => handleSpacingChange('paddingBottom', value[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};