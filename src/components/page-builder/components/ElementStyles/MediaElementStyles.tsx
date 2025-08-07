import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { PageBuilderElement } from '../../types';

interface MediaElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const MediaElementStyles: React.FC<MediaElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
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
              placeholder="auto"
            />
          </div>
          <div>
            <Label className="text-xs">Height</Label>
            <Input
              value={element.styles?.height || ''}
              onChange={(e) => onStyleUpdate('height', e.target.value)}
              placeholder="auto"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Max Width</Label>
          <Input
            value={element.styles?.maxWidth || ''}
            onChange={(e) => onStyleUpdate('maxWidth', e.target.value)}
            placeholder="100%"
          />
        </div>

        {element.type === 'image' && (
          <div>
            <Label className="text-xs">Object Fit</Label>
            <Select
              value={element.styles?.objectFit || 'cover'}
              onValueChange={(value) => onStyleUpdate('objectFit', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="fill">Fill</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="scale-down">Scale Down</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
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

      {/* Effects */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Effects</h4>
        
        <div>
          <Label className="text-xs">Opacity</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseFloat(element.styles?.opacity?.toString() || '1')]}
              onValueChange={(value) => onStyleUpdate('opacity', value[0].toString())}
              max={1}
              min={0}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {element.styles?.opacity || '1'}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Box Shadow</Label>
          <Input
            value={element.styles?.boxShadow || ''}
            onChange={(e) => onStyleUpdate('boxShadow', e.target.value)}
            placeholder="e.g., 0 4px 8px rgba(0,0,0,0.1)"
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