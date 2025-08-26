import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

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

  const clampNumber = (value: number): number => {
    return Math.max(0, Math.min(200, value));
  };

  const handleMarginChange = (property: 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft', value: number) => {
    onMarginChange(property, `${value}px`);
  };

  const handlePaddingChange = (property: 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft', value: number) => {
    onPaddingChange(property, `${value}px`);
  };

  const handleInputChange = (property: string, value: string, type: 'margin' | 'padding') => {
    const numValue = clampNumber(parseInt(value) || 0);
    if (type === 'margin') {
      handleMarginChange(property as any, numValue);
    } else {
      handlePaddingChange(property as any, numValue);
    }
  };

  return (
    <div className="space-y-4">
      {/* Margin */}
      <div>
        <Label className="text-xs font-medium mb-3 block">Margin</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Top</Label>
            <Slider
              value={[parsePixelValue(marginTop)]}
              onValueChange={(value) => handleMarginChange('marginTop', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={parsePixelValue(marginTop)}
              onChange={(e) => handleInputChange('marginTop', e.target.value, 'margin')}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Right</Label>
            <Slider
              value={[parsePixelValue(marginRight)]}
              onValueChange={(value) => handleMarginChange('marginRight', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={parsePixelValue(marginRight)}
              onChange={(e) => handleInputChange('marginRight', e.target.value, 'margin')}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Bottom</Label>
            <Slider
              value={[parsePixelValue(marginBottom)]}
              onValueChange={(value) => handleMarginChange('marginBottom', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={parsePixelValue(marginBottom)}
              onChange={(e) => handleInputChange('marginBottom', e.target.value, 'margin')}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Left</Label>
            <Slider
              value={[parsePixelValue(marginLeft)]}
              onValueChange={(value) => handleMarginChange('marginLeft', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={parsePixelValue(marginLeft)}
              onChange={(e) => handleInputChange('marginLeft', e.target.value, 'margin')}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
        </div>
      </div>

      {/* Padding */}
      <div>
        <Label className="text-xs font-medium mb-3 block">Padding</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Top</Label>
            <Slider
              value={[parsePixelValue(paddingTop)]}
              onValueChange={(value) => handlePaddingChange('paddingTop', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={parsePixelValue(paddingTop)}
              onChange={(e) => handleInputChange('paddingTop', e.target.value, 'padding')}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Right</Label>
            <Slider
              value={[parsePixelValue(paddingRight)]}
              onValueChange={(value) => handlePaddingChange('paddingRight', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={parsePixelValue(paddingRight)}
              onChange={(e) => handleInputChange('paddingRight', e.target.value, 'padding')}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Bottom</Label>
            <Slider
              value={[parsePixelValue(paddingBottom)]}
              onValueChange={(value) => handlePaddingChange('paddingBottom', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={parsePixelValue(paddingBottom)}
              onChange={(e) => handleInputChange('paddingBottom', e.target.value, 'padding')}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Left</Label>
            <Slider
              value={[parsePixelValue(paddingLeft)]}
              onValueChange={(value) => handlePaddingChange('paddingLeft', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={parsePixelValue(paddingLeft)}
              onChange={(e) => handleInputChange('paddingLeft', e.target.value, 'padding')}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
        </div>
      </div>
    </div>
  );
};