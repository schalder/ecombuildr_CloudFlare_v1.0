import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Smartphone, LayoutGrid, LayoutList } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilderElement } from '../../types';

interface SocialShareElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const SocialShareElementStyles: React.FC<SocialShareElementStylesProps> = ({
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

      {/* Layout & Positioning */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Layout & Positioning</h4>
        
        <div>
          <Label className="text-xs">Container Alignment</Label>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant={getCurrentValue('containerAlignment', 'center') === 'left' ? 'default' : 'outline'}
              onClick={() => handleResponsiveUpdate('containerAlignment', 'left')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={getCurrentValue('containerAlignment', 'center') === 'center' ? 'default' : 'outline'}
              onClick={() => handleResponsiveUpdate('containerAlignment', 'center')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={getCurrentValue('containerAlignment', 'center') === 'right' ? 'default' : 'outline'}
              onClick={() => handleResponsiveUpdate('containerAlignment', 'right')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Full Width Container</Label>
          <Switch
            checked={getCurrentValue('maxWidth') === 'none'}
            onCheckedChange={(checked) => handleResponsiveUpdate('maxWidth', checked ? 'none' : '32rem')}
          />
        </div>

        {getCurrentValue('maxWidth') !== 'none' && (
          <div>
            <Label className="text-xs">Max Width</Label>
            <Input
              value={getCurrentValue('maxWidth', '32rem')}
              onChange={(e) => handleResponsiveUpdate('maxWidth', e.target.value)}
              placeholder="e.g., 32rem, 500px"
            />
          </div>
        )}

        <div>
          <Label className="text-xs">Button Layout</Label>
          <Select
            value={getCurrentValue('buttonLayout', 'horizontal')}
            onValueChange={(value) => handleResponsiveUpdate('buttonLayout', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal">Horizontal</SelectItem>
              <SelectItem value="vertical">Vertical</SelectItem>
              <SelectItem value="grid">Grid (2 columns)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Button Spacing</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(getCurrentValue('buttonSpacing', '12px').replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('buttonSpacing', `${value[0]}px`)}
              max={50}
              min={0}
              step={2}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {getCurrentValue('buttonSpacing', '12px')}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Title Typography */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title Typography</h4>
        
        <div>
          <Label className="text-xs">Title Font Size</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(getCurrentValue('titleFontSize', '18px').replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('titleFontSize', `${value[0]}px`)}
              max={60}
              min={12}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {getCurrentValue('titleFontSize', '18px')}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Title Font Weight</Label>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant={getCurrentValue('titleFontWeight', 'semibold') === 'normal' ? 'default' : 'outline'}
              onClick={() => handleResponsiveUpdate('titleFontWeight', 'normal')}
            >
              Normal
            </Button>
            <Button
              size="sm"
              variant={getCurrentValue('titleFontWeight', 'semibold') === 'semibold' ? 'default' : 'outline'}
              onClick={() => handleResponsiveUpdate('titleFontWeight', 'semibold')}
            >
              Semibold
            </Button>
            <Button
              size="sm"
              variant={getCurrentValue('titleFontWeight', 'semibold') === 'bold' ? 'default' : 'outline'}
              onClick={() => handleResponsiveUpdate('titleFontWeight', 'bold')}
            >
              Bold
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs">Title Color</Label>
          <ColorPicker
            color={getCurrentValue('titleColor', '#000000')}
            onChange={(color) => handleResponsiveUpdate('titleColor', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Title Margin Bottom</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(getCurrentValue('titleMarginBottom', '16px').replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('titleMarginBottom', `${value[0]}px`)}
              max={50}
              min={0}
              step={2}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {getCurrentValue('titleMarginBottom', '16px')}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Button Styling */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Button Styling</h4>
        
        <div>
          <Label className="text-xs">Button Variant</Label>
          <Select
            value={getCurrentValue('buttonVariant', 'outline')}
            onValueChange={(value) => handleResponsiveUpdate('buttonVariant', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="ghost">Minimal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Button Size</Label>
          <Select
            value={getCurrentValue('buttonSize', 'sm')}
            onValueChange={(value) => handleResponsiveUpdate('buttonSize', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="default">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Button Text Color</Label>
          <ColorPicker
            color={getCurrentValue('buttonTextColor', '')}
            onChange={(color) => handleResponsiveUpdate('buttonTextColor', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Button Background Color</Label>
          <ColorPicker
            color={getCurrentValue('buttonBackgroundColor', '')}
            onChange={(color) => handleResponsiveUpdate('buttonBackgroundColor', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Button Hover Text Color</Label>
          <ColorPicker
            color={getCurrentValue('buttonHoverTextColor', '')}
            onChange={(color) => handleResponsiveUpdate('buttonHoverTextColor', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Button Hover Background</Label>
          <ColorPicker
            color={getCurrentValue('buttonHoverBackgroundColor', '')}
            onChange={(color) => handleResponsiveUpdate('buttonHoverBackgroundColor', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Button Border Width</Label>
          <Input
            value={getCurrentValue('buttonBorderWidth')}
            onChange={(e) => handleResponsiveUpdate('buttonBorderWidth', e.target.value)}
            placeholder="e.g., 1px"
          />
        </div>

        <div>
          <Label className="text-xs">Button Border Color</Label>
          <ColorPicker
            color={getCurrentValue('buttonBorderColor', '')}
            onChange={(color) => handleResponsiveUpdate('buttonBorderColor', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Button Border Radius</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(getCurrentValue('buttonBorderRadius', '6px').replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('buttonBorderRadius', `${value[0]}px`)}
              max={50}
              min={0}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {getCurrentValue('buttonBorderRadius', '6px')}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Background */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Background</h4>
        
        <div>
          <Label className="text-xs">Container Background</Label>
          <ColorPicker
            color={getCurrentValue('backgroundColor', '')}
            onChange={(color) => handleResponsiveUpdate('backgroundColor', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Background Opacity</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[getCurrentValue('backgroundOpacity', 100)]}
              onValueChange={(value) => handleResponsiveUpdate('backgroundOpacity', value[0])}
              max={100}
              min={0}
              step={5}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {getCurrentValue('backgroundOpacity', 100)}%
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Border & Effects */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Border & Effects</h4>
        
        <div>
          <Label className="text-xs">Container Border Width</Label>
          <Input
            value={getCurrentValue('borderWidth')}
            onChange={(e) => handleResponsiveUpdate('borderWidth', e.target.value)}
            placeholder="e.g., 1px"
          />
        </div>

        <div>
          <Label className="text-xs">Container Border Color</Label>
          <ColorPicker
            color={getCurrentValue('borderColor', '')}
            onChange={(color) => handleResponsiveUpdate('borderColor', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Container Border Radius</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(getCurrentValue('borderRadius', '0px').replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('borderRadius', `${value[0]}px`)}
              max={50}
              min={0}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {getCurrentValue('borderRadius', '0px')}
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