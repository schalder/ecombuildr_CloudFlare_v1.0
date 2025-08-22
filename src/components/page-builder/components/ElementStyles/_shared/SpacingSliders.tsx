import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface SpacingSlidersProps {
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  onMarginChange: (property: 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft', value: string) => void;
  onPaddingChange: (property: 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft', value: string) => void;
}

export const SpacingSliders: React.FC<SpacingSlidersProps> = ({
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  onMarginChange,
  onPaddingChange
}) => {
  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', '')) || 0;
  };

  const handleMarginChange = (property: 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft', value: number) => {
    onMarginChange(property, `${value}px`);
  };

  const handlePaddingChange = (property: 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft', value: number) => {
    onPaddingChange(property, `${value}px`);
  };

  return (
    <div className="space-y-4">
      {/* Margin */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Margin</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Top</Label>
              <span className="text-xs text-muted-foreground">{parsePixelValue(marginTop)}px</span>
            </div>
            <Slider
              value={[parsePixelValue(marginTop)]}
              onValueChange={(value) => handleMarginChange('marginTop', value[0])}
              max={200}
              step={1}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Right</Label>
              <span className="text-xs text-muted-foreground">{parsePixelValue(marginRight)}px</span>
            </div>
            <Slider
              value={[parsePixelValue(marginRight)]}
              onValueChange={(value) => handleMarginChange('marginRight', value[0])}
              max={200}
              step={1}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Bottom</Label>
              <span className="text-xs text-muted-foreground">{parsePixelValue(marginBottom)}px</span>
            </div>
            <Slider
              value={[parsePixelValue(marginBottom)]}
              onValueChange={(value) => handleMarginChange('marginBottom', value[0])}
              max={200}
              step={1}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Left</Label>
              <span className="text-xs text-muted-foreground">{parsePixelValue(marginLeft)}px</span>
            </div>
            <Slider
              value={[parsePixelValue(marginLeft)]}
              onValueChange={(value) => handleMarginChange('marginLeft', value[0])}
              max={200}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Padding */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Padding</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Top</Label>
              <span className="text-xs text-muted-foreground">{parsePixelValue(paddingTop)}px</span>
            </div>
            <Slider
              value={[parsePixelValue(paddingTop)]}
              onValueChange={(value) => handlePaddingChange('paddingTop', value[0])}
              max={200}
              step={1}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Right</Label>
              <span className="text-xs text-muted-foreground">{parsePixelValue(paddingRight)}px</span>
            </div>
            <Slider
              value={[parsePixelValue(paddingRight)]}
              onValueChange={(value) => handlePaddingChange('paddingRight', value[0])}
              max={200}
              step={1}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Bottom</Label>
              <span className="text-xs text-muted-foreground">{parsePixelValue(paddingBottom)}px</span>
            </div>
            <Slider
              value={[parsePixelValue(paddingBottom)]}
              onValueChange={(value) => handlePaddingChange('paddingBottom', value[0])}
              max={200}
              step={1}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Left</Label>
              <span className="text-xs text-muted-foreground">{parsePixelValue(paddingLeft)}px</span>
            </div>
            <Slider
              value={[parsePixelValue(paddingLeft)]}
              onValueChange={(value) => handlePaddingChange('paddingLeft', value[0])}
              max={200}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};