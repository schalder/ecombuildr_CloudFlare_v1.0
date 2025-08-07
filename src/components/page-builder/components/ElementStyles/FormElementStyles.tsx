import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { PageBuilderElement } from '../../types';

interface FormElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const FormElementStyles: React.FC<FormElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  return (
    <div className="space-y-4">
      {/* Typography */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Typography</h4>
        
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

      {/* Border */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Border</h4>
        
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