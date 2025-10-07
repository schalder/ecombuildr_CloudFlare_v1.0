import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';
import { ResponsiveSpacingSliders } from './_shared/ResponsiveSpacingSliders';

interface FormElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const FormElementStyles: React.FC<FormElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  const [typographyOpen, setTypographyOpen] = React.useState(true);
  const [backgroundOpen, setBackgroundOpen] = React.useState(false);
  const [borderOpen, setBorderOpen] = React.useState(false);
  const [spacingOpen, setSpacingOpen] = React.useState(false);

  const parseMarginPadding = (value: string) => {
    const parts = (value || '0px').split(' ');
    return {
      top: parts[0] || '0px',
      right: parts[1] || parts[0] || '0px',
      bottom: parts[2] || parts[0] || '0px',
      left: parts[3] || parts[1] || parts[0] || '0px'
    };
  };

  const formatMarginPadding = (top: string, right: string, bottom: string, left: string) => {
    return `${top} ${right} ${bottom} ${left}`;
  };

  // Helper functions for device-aware spacing conversion
  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', '')) || 0;
  };

  const getCurrentSpacingByDevice = () => {
    const marginByDevice = element.styles?.marginByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    
    const paddingByDevice = element.styles?.paddingByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };

    // Convert legacy spacing to device-aware if needed
    if (!element.styles?.marginByDevice && element.styles?.margin) {
      const margin = parseMarginPadding(element.styles.margin);
      marginByDevice.desktop = {
        top: parsePixelValue(margin.top),
        right: parsePixelValue(margin.right),
        bottom: parsePixelValue(margin.bottom),
        left: parsePixelValue(margin.left)
      };
    }

    if (!element.styles?.paddingByDevice && element.styles?.padding) {
      const padding = parseMarginPadding(element.styles.padding);
      paddingByDevice.desktop = {
        top: parsePixelValue(padding.top),
        right: parsePixelValue(padding.right),
        bottom: parsePixelValue(padding.bottom),
        left: parsePixelValue(padding.left)
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

  const margin = parseMarginPadding(element.styles?.margin as string);
  const padding = parseMarginPadding(element.styles?.padding as string);

  return (
    <div className="space-y-4">
      {/* Typography */}
      <CollapsibleGroup title="Typography" isOpen={typographyOpen} onToggle={setTypographyOpen}>
        <div>
          <Label className="text-xs">Font Size</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(element.styles?.fontSize?.replace(/\D/g, '') || '16')]}
              onValueChange={(value) => onStyleUpdate('fontSize', `${value[0]}px`)}
              max={24}
              min={12}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {element.styles?.fontSize || '16px'}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Text Color</Label>
          <Input
            type="color"
            value={element.styles?.color || '#000000'}
            onChange={(e) => onStyleUpdate('color', e.target.value)}
            className="w-full h-10"
          />
        </div>
      </CollapsibleGroup>

      {/* Background */}
      <CollapsibleGroup title="Background" isOpen={backgroundOpen} onToggle={setBackgroundOpen}>
        <div>
          <Label className="text-xs">Background Color</Label>
          <Input
            type="color"
            value={element.styles?.backgroundColor || '#ffffff'}
            onChange={(e) => onStyleUpdate('backgroundColor', e.target.value)}
            className="w-full h-10"
          />
        </div>
      </CollapsibleGroup>

      {/* Border */}
      <CollapsibleGroup title="Border" isOpen={borderOpen} onToggle={setBorderOpen}>
        <div>
          <Label className="text-xs">Border Width</Label>
          <Input
            value={element.styles?.borderWidth || ''}
            onChange={(e) => onStyleUpdate('borderWidth', e.target.value)}
            placeholder="e.g., 1px"
          />
        </div>

        <div>
          <Label className="text-xs">Border Color</Label>
          <Input
            type="color"
            value={element.styles?.borderColor || '#e5e7eb'}
            onChange={(e) => onStyleUpdate('borderColor', e.target.value)}
            className="w-full h-10"
          />
        </div>

        <div>
          <Label className="text-xs">Border Radius</Label>
          <Input
            value={element.styles?.borderRadius || ''}
            onChange={(e) => onStyleUpdate('borderRadius', e.target.value)}
            placeholder="e.g., 4px"
          />
        </div>
      </CollapsibleGroup>

      {/* Spacing */}
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