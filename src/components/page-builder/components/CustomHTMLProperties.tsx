import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageBuilderElement } from '../types';
import { ResponsiveControls } from './ResponsiveControls';

interface CustomHTMLPropertiesProps {
  element: PageBuilderElement;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  onUpdate: (updates: Partial<PageBuilderElement>) => void;
}

export const CustomHTMLProperties: React.FC<CustomHTMLPropertiesProps> = ({
  element,
  deviceType,
  onUpdate
}) => {
  const currentStyles = element.styles?.[deviceType] || {};

  const handleStyleUpdate = (property: string, value: string) => {
    onUpdate({
      styles: {
        ...element.styles,
        [deviceType]: {
          ...currentStyles,
          [property]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <ResponsiveControls
        deviceType={deviceType}
        onDeviceChange={() => {}} // This will be handled by parent
      />

      {/* Spacing Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          SPACING
        </h3>
        
        {/* Margin */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Margin</Label>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <Label className="text-xs text-primary mb-1 block">Top</Label>
              <Input
                value={currentStyles.marginTop || '0px'}
                onChange={(e) => handleStyleUpdate('marginTop', e.target.value)}
                placeholder="0px"
                className="h-8 text-xs text-center"
              />
            </div>
            <div className="text-center">
              <Label className="text-xs text-primary mb-1 block">Right</Label>
              <Input
                value={currentStyles.marginRight || '0px'}
                onChange={(e) => handleStyleUpdate('marginRight', e.target.value)}
                placeholder="0px"
                className="h-8 text-xs text-center"
              />
            </div>
            <div className="text-center">
              <Label className="text-xs text-primary mb-1 block">Bottom</Label>
              <Input
                value={currentStyles.marginBottom || '0px'}
                onChange={(e) => handleStyleUpdate('marginBottom', e.target.value)}
                placeholder="0px"
                className="h-8 text-xs text-center"
              />
            </div>
            <div className="text-center">
              <Label className="text-xs text-primary mb-1 block">Left</Label>
              <Input
                value={currentStyles.marginLeft || '0px'}
                onChange={(e) => handleStyleUpdate('marginLeft', e.target.value)}
                placeholder="0px"
                className="h-8 text-xs text-center"
              />
            </div>
          </div>
        </div>

        {/* Padding */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Padding</Label>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <Label className="text-xs text-primary mb-1 block">Top</Label>
              <Input
                value={currentStyles.paddingTop || '0px'}
                onChange={(e) => handleStyleUpdate('paddingTop', e.target.value)}
                placeholder="0px"
                className="h-8 text-xs text-center"
              />
            </div>
            <div className="text-center">
              <Label className="text-xs text-primary mb-1 block">Right</Label>
              <Input
                value={currentStyles.paddingRight || '0px'}
                onChange={(e) => handleStyleUpdate('paddingRight', e.target.value)}
                placeholder="0px"
                className="h-8 text-xs text-center"
              />
            </div>
            <div className="text-center">
              <Label className="text-xs text-primary mb-1 block">Bottom</Label>
              <Input
                value={currentStyles.paddingBottom || '0px'}
                onChange={(e) => handleStyleUpdate('paddingBottom', e.target.value)}
                placeholder="0px"
                className="h-8 text-xs text-center"
              />
            </div>
            <div className="text-center">
              <Label className="text-xs text-primary mb-1 block">Left</Label>
              <Input
                value={currentStyles.paddingLeft || '0px'}
                onChange={(e) => handleStyleUpdate('paddingLeft', e.target.value)}
                placeholder="0px"
                className="h-8 text-xs text-center"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};