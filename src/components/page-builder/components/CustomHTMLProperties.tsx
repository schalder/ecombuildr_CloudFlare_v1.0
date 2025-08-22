import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PageBuilderElement } from '../types';

interface CustomHTMLPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (updates: Partial<PageBuilderElement>) => void;
  deviceType: 'desktop' | 'tablet' | 'mobile';
}

export const CustomHTMLProperties: React.FC<CustomHTMLPropertiesProps> = ({
  element,
  onUpdate,
  deviceType
}) => {
  const updateStyle = (property: string, value: string) => {
    const currentStyles = element.styles || {};
    const deviceStyles = currentStyles[deviceType] || {};
    
    onUpdate({
      styles: {
        ...currentStyles,
        [deviceType]: {
          ...deviceStyles,
          [property]: value
        }
      }
    });
  };

  const getStyleValue = (property: string): string => {
    const styles = element.styles?.[deviceType] || {};
    return styles[property] || '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Spacing</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Margin</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Top</Label>
                <Input
                  value={getStyleValue('marginTop')}
                  onChange={(e) => updateStyle('marginTop', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Right</Label>
                <Input
                  value={getStyleValue('marginRight')}
                  onChange={(e) => updateStyle('marginRight', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Bottom</Label>
                <Input
                  value={getStyleValue('marginBottom')}
                  onChange={(e) => updateStyle('marginBottom', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Left</Label>
                <Input
                  value={getStyleValue('marginLeft')}
                  onChange={(e) => updateStyle('marginLeft', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Padding</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Top</Label>
                <Input
                  value={getStyleValue('paddingTop')}
                  onChange={(e) => updateStyle('paddingTop', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Right</Label>
                <Input
                  value={getStyleValue('paddingRight')}
                  onChange={(e) => updateStyle('paddingRight', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Bottom</Label>
                <Input
                  value={getStyleValue('paddingBottom')}
                  onChange={(e) => updateStyle('paddingBottom', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Left</Label>
                <Input
                  value={getStyleValue('paddingLeft')}
                  onChange={(e) => updateStyle('paddingLeft', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};