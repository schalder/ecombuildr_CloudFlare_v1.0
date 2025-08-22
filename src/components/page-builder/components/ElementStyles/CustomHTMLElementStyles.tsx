import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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

  const handleSpacingChange = (property: string, value: string) => {
    onStyleUpdate(deviceType, {
      ...currentStyles,
      [property]: value
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Spacing</Label>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Margin Top</Label>
              <Input
                type="text"
                value={currentStyles.marginTop || '0'}
                onChange={(e) => handleSpacingChange('marginTop', e.target.value)}
                placeholder="0"
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Margin Bottom</Label>
              <Input
                type="text"
                value={currentStyles.marginBottom || '0'}
                onChange={(e) => handleSpacingChange('marginBottom', e.target.value)}
                placeholder="0"
                className="h-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Padding Top</Label>
              <Input
                type="text"
                value={currentStyles.paddingTop || '0'}
                onChange={(e) => handleSpacingChange('paddingTop', e.target.value)}
                placeholder="0"
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Padding Bottom</Label>
              <Input
                type="text"
                value={currentStyles.paddingBottom || '0'}
                onChange={(e) => handleSpacingChange('paddingBottom', e.target.value)}
                placeholder="0"
                className="h-8"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};