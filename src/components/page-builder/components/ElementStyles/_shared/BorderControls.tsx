import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BorderControlsProps {
  borderWidth?: string;
  borderColor?: string;
  borderRadius?: string;
  borderStyle?: string;
  onBorderChange: (property: 'borderWidth' | 'borderColor' | 'borderRadius' | 'borderStyle', value: string) => void;
}

const parsePixelValue = (value?: string): number => {
  if (!value) return 0;
  const parsed = parseInt(value.replace(/[^0-9]/g, ''));
  return Math.min(100, Math.max(0, parsed || 0));
};

export const BorderControls: React.FC<BorderControlsProps> = ({
  borderWidth,
  borderColor,
  borderRadius,
  borderStyle,
  onBorderChange
}) => {
  const borderWidthValue = parsePixelValue(borderWidth);
  const borderRadiusValue = parsePixelValue(borderRadius);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Border Width: {borderWidthValue}px</Label>
        <Slider
          min={0}
          max={20}
          step={1}
          value={[borderWidthValue]}
          onValueChange={(v) => onBorderChange('borderWidth', v[0] > 0 ? `${v[0]}px` : '')}
        />
      </div>
      
      {borderWidthValue > 0 && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Border Style</Label>
            <Select
              value={borderStyle || 'solid'}
              onValueChange={(value) => onBorderChange('borderStyle', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="double">Double</SelectItem>
                <SelectItem value="groove">Groove</SelectItem>
                <SelectItem value="ridge">Ridge</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Border Color</Label>
            <ColorPicker
              color={borderColor || 'transparent'}
              onChange={(color) => onBorderChange('borderColor', color)}
            />
          </div>
        </>
      )}
      
      <div className="space-y-2">
        <Label className="text-xs">Border Radius: {borderRadiusValue}px</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[borderRadiusValue]}
          onValueChange={(v) => onBorderChange('borderRadius', v[0] > 0 ? `${v[0]}px` : '')}
        />
      </div>
    </div>
  );
};