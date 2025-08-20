import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Smartphone } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
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

  // Helper to get current value with fallback
  const getCurrentValue = (prop: string, fallback: any = '') => {
    return currentStyles[prop] || element.styles?.[prop] || fallback;
  };

  return (
    <div className="space-y-4">
      {/* Device Toggle */}
      <div className="space-y-3">
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
        </Tabs>
      </div>

      <Separator />

      {/* Width Controls */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Width</h4>
        
        <div className="flex items-center justify-between">
          <Label className="text-xs">Full Width</Label>
          <Switch
            checked={getCurrentValue('width') === '100%'}
            onCheckedChange={(checked) => handleResponsiveUpdate('width', checked ? '100%' : 'auto')}
          />
        </div>

        {getCurrentValue('width') !== '100%' && (
          <div>
            <Label className="text-xs">Custom Width</Label>
            <Input
              value={getCurrentValue('width')}
              onChange={(e) => handleResponsiveUpdate('width', e.target.value)}
              placeholder="e.g., 200px, 50%"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Typography */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Typography</h4>
        
        <div>
          <Label className="text-xs">Font Size</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(getCurrentValue('fontSize', '16px').replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('fontSize', `${value[0]}px`)}
              max={100}
              min={8}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {getCurrentValue('fontSize', '16px')}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Font Weight</Label>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant={getCurrentValue('fontWeight') === 'normal' ? 'default' : 'outline'}
              onClick={() => handleResponsiveUpdate('fontWeight', 'normal')}
            >
              Normal
            </Button>
            <Button
              size="sm"
              variant={getCurrentValue('fontWeight') === 'bold' ? 'default' : 'outline'}
              onClick={() => handleResponsiveUpdate('fontWeight', 'bold')}
            >
              Bold
            </Button>
          </div>
        </div>
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
              variant={getCurrentValue('textAlign', 'left') === 'left' ? 'default' : 'outline'}
              onClick={() => handleResponsiveUpdate('textAlign', 'left')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={getCurrentValue('textAlign', 'left') === 'center' ? 'default' : 'outline'}
              onClick={() => handleResponsiveUpdate('textAlign', 'center')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={getCurrentValue('textAlign', 'left') === 'right' ? 'default' : 'outline'}
              onClick={() => handleResponsiveUpdate('textAlign', 'right')}
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
          <ColorPicker
            color={getCurrentValue('color', '#ffffff')}
            onChange={(color) => handleResponsiveUpdate('color', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Background Color</Label>
          <ColorPicker
            color={getCurrentValue('backgroundColor', '#3b82f6')}
            onChange={(color) => handleResponsiveUpdate('backgroundColor', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Text Hover Color</Label>
          <ColorPicker
            color={getCurrentValue('hoverColor', '')}
            onChange={(color) => handleResponsiveUpdate('hoverColor', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Background Hover Color</Label>
          <ColorPicker
            color={getCurrentValue('hoverBackgroundColor', '')}
            onChange={(color) => handleResponsiveUpdate('hoverBackgroundColor', color)}
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
            value={getCurrentValue('borderWidth')}
            onChange={(e) => handleResponsiveUpdate('borderWidth', e.target.value)}
            placeholder="e.g., 1px"
          />
        </div>

        <div>
          <Label className="text-xs">Border Color</Label>
          <ColorPicker
            color={getCurrentValue('borderColor', '#e5e7eb')}
            onChange={(color) => handleResponsiveUpdate('borderColor', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Border Radius</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(getCurrentValue('borderRadius', '6px').replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('borderRadius', `${value[0]}px`)}
              max={50}
              min={0}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {getCurrentValue('borderRadius', '6px')}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Box Shadow</Label>
          <Input
            value={getCurrentValue('boxShadow')}
            onChange={(e) => handleResponsiveUpdate('boxShadow', e.target.value)}
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
          <div className="grid grid-cols-4 gap-1">
            <Input
              value={getCurrentValue('marginTop')}
              onChange={(e) => handleResponsiveUpdate('marginTop', e.target.value)}
              placeholder="Top"
              className="text-xs"
            />
            <Input
              value={getCurrentValue('marginRight')}
              onChange={(e) => handleResponsiveUpdate('marginRight', e.target.value)}
              placeholder="Right"
              className="text-xs"
            />
            <Input
              value={getCurrentValue('marginBottom')}
              onChange={(e) => handleResponsiveUpdate('marginBottom', e.target.value)}
              placeholder="Bottom"
              className="text-xs"
            />
            <Input
              value={getCurrentValue('marginLeft')}
              onChange={(e) => handleResponsiveUpdate('marginLeft', e.target.value)}
              placeholder="Left"
              className="text-xs"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Padding</Label>
          <div className="grid grid-cols-4 gap-1">
            <Input
              value={getCurrentValue('paddingTop')}
              onChange={(e) => handleResponsiveUpdate('paddingTop', e.target.value)}
              placeholder="Top"
              className="text-xs"
            />
            <Input
              value={getCurrentValue('paddingRight')}
              onChange={(e) => handleResponsiveUpdate('paddingRight', e.target.value)}
              placeholder="Right"
              className="text-xs"
            />
            <Input
              value={getCurrentValue('paddingBottom')}
              onChange={(e) => handleResponsiveUpdate('paddingBottom', e.target.value)}
              placeholder="Bottom"
              className="text-xs"
            />
            <Input
              value={getCurrentValue('paddingLeft')}
              onChange={(e) => handleResponsiveUpdate('paddingLeft', e.target.value)}
              placeholder="Left"
              className="text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};