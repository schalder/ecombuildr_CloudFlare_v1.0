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
  onMarginChange?: (property: 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft', value: string) => void;
  onPaddingChange?: (property: 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft', value: string) => void;
}

const parsePixelValue = (value?: string): number => {
  if (!value) return 0;
  const parsed = parseInt(value.replace(/[^0-9]/g, ''));
  return Math.min(200, Math.max(0, parsed || 0));
};

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
  onPaddingChange,
}) => {
  const handleMarginChange = (property: 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft', value: number[]) => {
    onMarginChange?.(property, `${value[0]}px`);
  };

  const handlePaddingChange = (property: 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft', value: number[]) => {
    onPaddingChange?.(property, `${value[0]}px`);
  };

  return (
    <div className="space-y-6">
      {/* Margin Controls */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Margin</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Top: {parsePixelValue(marginTop)}px</Label>
            <Slider
              min={0}
              max={200}
              step={1}
              value={[parsePixelValue(marginTop)]}
              onValueChange={(value) => handleMarginChange('marginTop', value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Right: {parsePixelValue(marginRight)}px</Label>
            <Slider
              min={0}
              max={200}
              step={1}
              value={[parsePixelValue(marginRight)]}
              onValueChange={(value) => handleMarginChange('marginRight', value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Bottom: {parsePixelValue(marginBottom)}px</Label>
            <Slider
              min={0}
              max={200}
              step={1}
              value={[parsePixelValue(marginBottom)]}
              onValueChange={(value) => handleMarginChange('marginBottom', value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Left: {parsePixelValue(marginLeft)}px</Label>
            <Slider
              min={0}
              max={200}
              step={1}
              value={[parsePixelValue(marginLeft)]}
              onValueChange={(value) => handleMarginChange('marginLeft', value)}
            />
          </div>
        </div>
      </div>

      {/* Padding Controls */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Padding</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Top: {parsePixelValue(paddingTop)}px</Label>
            <Slider
              min={0}
              max={200}
              step={1}
              value={[parsePixelValue(paddingTop)]}
              onValueChange={(value) => handlePaddingChange('paddingTop', value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Right: {parsePixelValue(paddingRight)}px</Label>
            <Slider
              min={0}
              max={200}
              step={1}
              value={[parsePixelValue(paddingRight)]}
              onValueChange={(value) => handlePaddingChange('paddingRight', value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Bottom: {parsePixelValue(paddingBottom)}px</Label>
            <Slider
              min={0}
              max={200}
              step={1}
              value={[parsePixelValue(paddingBottom)]}
              onValueChange={(value) => handlePaddingChange('paddingBottom', value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Left: {parsePixelValue(paddingLeft)}px</Label>
            <Slider
              min={0}
              max={200}
              step={1}
              value={[parsePixelValue(paddingLeft)]}
              onValueChange={(value) => handlePaddingChange('paddingLeft', value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};