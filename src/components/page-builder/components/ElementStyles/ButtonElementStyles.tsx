import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';

interface ButtonElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const ButtonElementStyles: React.FC<ButtonElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  const [responsiveTab, setResponsiveTab] = useState<'desktop' | 'mobile'>('desktop');

  // Get responsive styles
  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentStyles = responsiveStyles[responsiveTab] || {};

  const handleResponsiveUpdate = (property: string, value: any) => {
    const updatedResponsive = {
      ...responsiveStyles,
      [responsiveTab]: {
        ...currentStyles,
        [property]: value
      }
    };
    onStyleUpdate('responsive', updatedResponsive);
  };

  return (
    <div className="space-y-4">
      {/* Width Controls */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Width</h4>
        
        <div className="flex items-center justify-between">
          <Label className="text-xs">Full Width</Label>
          <Switch
            checked={element.styles?.width === '100%'}
            onCheckedChange={(checked) => onStyleUpdate('width', checked ? '100%' : 'auto')}
          />
        </div>

        {element.styles?.width !== '100%' && (
          <div>
            <Label className="text-xs">Custom Width</Label>
            <Input
              value={element.styles?.width || ''}
              onChange={(e) => onStyleUpdate('width', e.target.value)}
              placeholder="e.g., 200px, 50%"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Responsive Typography */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Responsive Typography</h4>
        
        <Tabs value={responsiveTab} onValueChange={(value) => setResponsiveTab(value as 'desktop' | 'mobile')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop" className="flex items-center gap-2">
              <Monitor className="h-3 w-3" />
              Desktop
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-3 w-3" />
              Mobile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="desktop" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Font Size (Desktop)</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[parseInt(currentStyles.fontSize?.replace(/\D/g, '') || element.styles?.fontSize?.replace(/\D/g, '') || '16')]}
                  onValueChange={(value) => handleResponsiveUpdate('fontSize', `${value[0]}px`)}
                  max={48}
                  min={8}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {currentStyles.fontSize || element.styles?.fontSize || '16px'}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-xs">Font Weight</Label>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={currentStyles.fontWeight === 'normal' ? 'default' : 'outline'}
                  onClick={() => handleResponsiveUpdate('fontWeight', 'normal')}
                >
                  Normal
                </Button>
                <Button
                  size="sm"
                  variant={currentStyles.fontWeight === 'bold' ? 'default' : 'outline'}
                  onClick={() => handleResponsiveUpdate('fontWeight', 'bold')}
                >
                  Bold
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Font Size (Mobile)</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[parseInt(currentStyles.fontSize?.replace(/\D/g, '') || '14')]}
                  onValueChange={(value) => handleResponsiveUpdate('fontSize', `${value[0]}px`)}
                  max={32}
                  min={8}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {currentStyles.fontSize || '14px'}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-xs">Font Weight</Label>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={currentStyles.fontWeight === 'normal' ? 'default' : 'outline'}
                  onClick={() => handleResponsiveUpdate('fontWeight', 'normal')}
                >
                  Normal
                </Button>
                <Button
                  size="sm"
                  variant={currentStyles.fontWeight === 'bold' ? 'default' : 'outline'}
                  onClick={() => handleResponsiveUpdate('fontWeight', 'bold')}
                >
                  Bold
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Alignment */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alignment</h4>
        
        <div>
          <Label className="text-xs">Text Align</Label>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant={element.styles?.textAlign === 'left' ? 'default' : 'outline'}
              onClick={() => onStyleUpdate('textAlign', 'left')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={element.styles?.textAlign === 'center' ? 'default' : 'outline'}
              onClick={() => onStyleUpdate('textAlign', 'center')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={element.styles?.textAlign === 'right' ? 'default' : 'outline'}
              onClick={() => onStyleUpdate('textAlign', 'right')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Colors</h4>
        
        <div>
          <Label className="text-xs">Text Color</Label>
          <Input
            type="color"
            value={element.styles?.color || '#ffffff'}
            onChange={(e) => onStyleUpdate('color', e.target.value)}
            className="w-full h-10"
          />
        </div>

        <div>
          <Label className="text-xs">Background Color</Label>
          <Input
            type="color"
            value={element.styles?.backgroundColor || '#3b82f6'}
            onChange={(e) => onStyleUpdate('backgroundColor', e.target.value)}
            className="w-full h-10"
          />
        </div>
      </div>

      <Separator />

      {/* Borders & Effects */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Borders & Effects</h4>
        
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
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(element.styles?.borderRadius?.replace(/\D/g, '') || '6')]}
              onValueChange={(value) => onStyleUpdate('borderRadius', `${value[0]}px`)}
              max={50}
              min={0}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {element.styles?.borderRadius || '6px'}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Box Shadow</Label>
          <Input
            value={element.styles?.boxShadow || ''}
            onChange={(e) => onStyleUpdate('boxShadow', e.target.value)}
            placeholder="e.g., 0 2px 4px rgba(0,0,0,0.1)"
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
            placeholder="Smart padding applied automatically"
          />
        </div>
      </div>
    </div>
  );
};