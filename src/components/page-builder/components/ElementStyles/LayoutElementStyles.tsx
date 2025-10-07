import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilderElement } from '../../types';
import { SpacingSliders } from './_shared/SpacingSliders';
import { ResponsiveSpacingSliders } from './_shared/ResponsiveSpacingSliders';

interface LayoutElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const LayoutElementStyles: React.FC<LayoutElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
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
    if (!element.styles?.marginByDevice && (element.styles?.marginTop || element.styles?.marginRight || element.styles?.marginBottom || element.styles?.marginLeft)) {
      marginByDevice.desktop = {
        top: parsePixelValue(element.styles?.marginTop),
        right: parsePixelValue(element.styles?.marginRight),
        bottom: parsePixelValue(element.styles?.marginBottom),
        left: parsePixelValue(element.styles?.marginLeft)
      };
    }

    if (!element.styles?.paddingByDevice && (element.styles?.paddingTop || element.styles?.paddingRight || element.styles?.paddingBottom || element.styles?.paddingLeft)) {
      paddingByDevice.desktop = {
        top: parsePixelValue(element.styles?.paddingTop),
        right: parsePixelValue(element.styles?.paddingRight),
        bottom: parsePixelValue(element.styles?.paddingBottom),
        left: parsePixelValue(element.styles?.paddingLeft)
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
  const parseSpacingProperty = (value: string | undefined, property: 'margin' | 'padding'): { top: string; right: string; bottom: string; left: string } => {
    if (!value) return { top: '0px', right: '0px', bottom: '0px', left: '0px' };
    
    const parts = value.trim().split(/\s+/);
    
    if (parts.length === 1) {
      // All sides same value
      return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    } else if (parts.length === 2) {
      // Top/bottom and left/right
      return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    } else if (parts.length === 4) {
      // Top, right, bottom, left
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
    }
    
    return { top: '0px', right: '0px', bottom: '0px', left: '0px' };
  };

  const updateSpacingProperty = (property: 'margin' | 'padding', direction: string, value: string) => {
    const currentSpacing = parseSpacingProperty(element.styles?.[property], property);
    const newSpacing = { ...currentSpacing };
    
    if (direction === 'marginTop' || direction === 'paddingTop') newSpacing.top = value;
    if (direction === 'marginRight' || direction === 'paddingRight') newSpacing.right = value;
    if (direction === 'marginBottom' || direction === 'paddingBottom') newSpacing.bottom = value;
    if (direction === 'marginLeft' || direction === 'paddingLeft') newSpacing.left = value;
    
    const spacingString = `${newSpacing.top} ${newSpacing.right} ${newSpacing.bottom} ${newSpacing.left}`;
    onStyleUpdate(property, spacingString);
  };

  // For divider elements, only show spacing controls
  if (element.type === 'divider') {
    const marginSpacing = parseSpacingProperty(element.styles?.margin, 'margin');
    const paddingSpacing = parseSpacingProperty(element.styles?.padding, 'padding');

    return (
      <div className="space-y-4">
        <SpacingSliders
          marginTop={marginSpacing.top}
          marginRight={marginSpacing.right}
          marginBottom={marginSpacing.bottom}
          marginLeft={marginSpacing.left}
          paddingTop={paddingSpacing.top}
          paddingRight={paddingSpacing.right}
          paddingBottom={paddingSpacing.bottom}
          paddingLeft={paddingSpacing.left}
          onMarginChange={(direction, value) => updateSpacingProperty('margin', direction, value)}
          onPaddingChange={(direction, value) => updateSpacingProperty('padding', direction, value)}
        />
      </div>
    );
  }

  // For spacer elements, show background and spacing controls (no dimensions)
  if (element.type === 'spacer') {
    const marginSpacing = parseSpacingProperty(element.styles?.margin, 'margin');
    const paddingSpacing = parseSpacingProperty(element.styles?.padding, 'padding');

    return (
      <div className="space-y-4">
        {/* Background */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Background</h4>
          
          <ColorPicker
            color={element.styles?.backgroundColor || ''}
            onChange={(color) => onStyleUpdate('backgroundColor', color)}
            label="Background Color"
          />
        </div>

        <Separator />

        {/* Spacing */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</h4>
          
          <SpacingSliders
            marginTop={marginSpacing.top}
            marginRight={marginSpacing.right}
            marginBottom={marginSpacing.bottom}
            marginLeft={marginSpacing.left}
            paddingTop={paddingSpacing.top}
            paddingRight={paddingSpacing.right}
            paddingBottom={paddingSpacing.bottom}
            paddingLeft={paddingSpacing.left}
            onMarginChange={(direction, value) => updateSpacingProperty('margin', direction, value)}
            onPaddingChange={(direction, value) => updateSpacingProperty('padding', direction, value)}
          />
        </div>
      </div>
    );
  }

  // For all other elements, show full layout controls
  return (
    <div className="space-y-4">
      {/* Dimensions */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dimensions</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Width</Label>
            <Input
              value={element.styles?.width || ''}
              onChange={(e) => onStyleUpdate('width', e.target.value)}
              placeholder="100%"
            />
          </div>
          <div>
            <Label className="text-xs">Height</Label>
            <Input
              value={element.styles?.height || ''}
              onChange={(e) => onStyleUpdate('height', e.target.value)}
              placeholder="50px"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Background */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Background</h4>
        
        <div>
          <Label className="text-xs">Background Color</Label>
          <Input
            type="color"
            value={element.styles?.backgroundColor || '#ffffff'}
            onChange={(e) => onStyleUpdate('backgroundColor', e.target.value)}
            className="w-full h-10"
          />
        </div>
      </div>

      <Separator />

      {/* Spacing */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</h4>
        
        <ResponsiveSpacingSliders
          marginByDevice={getCurrentSpacingByDevice().marginByDevice}
          paddingByDevice={getCurrentSpacingByDevice().paddingByDevice}
          onMarginChange={handleMarginChange}
          onPaddingChange={handlePaddingChange}
        />
      </div>
    </div>
  );
};