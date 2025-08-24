import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { PageBuilderElement } from '../../types';

interface LayoutElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const LayoutElementStyles: React.FC<LayoutElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  // For divider elements, only show spacing controls
  if (element.type === 'divider') {
    return (
      <div className="space-y-4">
        {/* Spacing */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</h4>
          
          <div>
            <Label className="text-xs">Margin</Label>
            <Input
              value={element.styles?.margin || ''}
              onChange={(e) => onStyleUpdate('margin', e.target.value)}
              placeholder="e.g., 20px 0"
            />
          </div>

          <div>
            <Label className="text-xs">Padding</Label>
            <Input
              value={element.styles?.padding || ''}
              onChange={(e) => onStyleUpdate('padding', e.target.value)}
              placeholder="e.g., 10px 20px"
            />
          </div>
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
        
        <div>
          <Label className="text-xs">Margin</Label>
          <Input
            value={element.styles?.margin || ''}
            onChange={(e) => onStyleUpdate('margin', e.target.value)}
            placeholder="e.g., 10px 20px"
          />
        </div>

        <div>
          <Label className="text-xs">Padding</Label>
          <Input
            value={element.styles?.padding || ''}
            onChange={(e) => onStyleUpdate('padding', e.target.value)}
            placeholder="e.g., 10px 20px"
          />
        </div>
      </div>
    </div>
  );
};