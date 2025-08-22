import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Smartphone, LayoutGrid, LayoutList, ChevronDown } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { BoxShadowPicker } from '@/components/ui/box-shadow-picker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PageBuilderElement } from '../../types';

interface SocialShareElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const SocialShareElementStyles: React.FC<SocialShareElementStylesProps> = ({
  element,
  onStyleUpdate
}) => {
  const [responsiveTab, setResponsiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [openSections, setOpenSections] = useState({
    layout: true,
    typography: false,
    buttons: false,
    background: false,
    borders: false,
    spacing: false
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper to handle responsive updates
  const handleResponsiveUpdate = (property: string, value: any) => {
    const currentResponsive = element.styles?.responsive || { desktop: {}, mobile: {} };
    
    const updatedResponsive = {
      ...currentResponsive,
      [responsiveTab]: {
        ...currentResponsive[responsiveTab],
        [property]: value
      }
    };
    
    onStyleUpdate('responsive', updatedResponsive);
  };

  // Get current responsive styles
  const currentStyles = element.styles?.responsive?.[responsiveTab] || {};

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
      <Collapsible open={openSections.layout} onOpenChange={() => toggleSection('layout')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Layout & Positioning</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.layout ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
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

          <div>
            <Label className="text-xs">Max Width</Label>
            <Input
              value={getCurrentValue('maxWidth', '32rem')}
              onChange={(e) => handleResponsiveUpdate('maxWidth', e.target.value)}
              placeholder="e.g., 32rem, 500px, none"
            />
          </div>

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
                <SelectItem value="grid">Grid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Button Spacing</Label>
            <div className="px-2">
              <Slider
                value={[parseInt(getCurrentValue('buttonSpacing', '12').replace('px', ''))]}
                onValueChange={(value) => handleResponsiveUpdate('buttonSpacing', `${value[0]}px`)}
                max={50}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {getCurrentValue('buttonSpacing', '12px')}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Title Typography */}
      <Collapsible open={openSections.typography} onOpenChange={() => toggleSection('typography')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title Typography</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.typography ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div>
            <Label className="text-xs">Title Font Size</Label>
            <div className="px-2">
              <Slider
                value={[parseInt(getCurrentValue('titleFontSize', '18').replace('px', ''))]}
                onValueChange={(value) => handleResponsiveUpdate('titleFontSize', `${value[0]}px`)}
                max={48}
                min={12}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {getCurrentValue('titleFontSize', '18px')}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Title Font Weight</Label>
            <Select
              value={getCurrentValue('titleFontWeight', 'semibold')}
              onValueChange={(value) => handleResponsiveUpdate('titleFontWeight', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="semibold">Semibold</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Title Color</Label>
            <ColorPicker
              color={getCurrentValue('titleColor', '#FFFFFF')}
              onChange={(color) => handleResponsiveUpdate('titleColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Title Margin Bottom</Label>
            <div className="px-2">
              <Slider
                value={[parseInt(getCurrentValue('titleMarginBottom', '16').replace('px', ''))]}
                onValueChange={(value) => handleResponsiveUpdate('titleMarginBottom', `${value[0]}px`)}
                max={50}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {getCurrentValue('titleMarginBottom', '16px')}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Button Styling */}
      <Collapsible open={openSections.buttons} onOpenChange={() => toggleSection('buttons')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Button Styling</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.buttons ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
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
                <SelectItem value="ghost">Ghost</SelectItem>
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
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Button Text Color</Label>
            <ColorPicker
              color={getCurrentValue('buttonTextColor', 'auto')}
              onChange={(color) => handleResponsiveUpdate('buttonTextColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Button Background Color</Label>
            <ColorPicker
              color={getCurrentValue('buttonBackgroundColor', 'auto')}
              onChange={(color) => handleResponsiveUpdate('buttonBackgroundColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Button Hover Text Color</Label>
            <ColorPicker
              color={getCurrentValue('buttonHoverTextColor', 'auto')}
              onChange={(color) => handleResponsiveUpdate('buttonHoverTextColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Button Hover Background</Label>
            <ColorPicker
              color={getCurrentValue('buttonHoverBackgroundColor', 'auto')}
              onChange={(color) => handleResponsiveUpdate('buttonHoverBackgroundColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Button Border Width</Label>
            <Input
              value={getCurrentValue('buttonBorderWidth', '')}
              onChange={(e) => handleResponsiveUpdate('buttonBorderWidth', e.target.value)}
              placeholder="e.g., 1px"
            />
          </div>

          <div>
            <Label className="text-xs">Button Border Color</Label>
            <ColorPicker
              color={getCurrentValue('buttonBorderColor', 'auto')}
              onChange={(color) => handleResponsiveUpdate('buttonBorderColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Button Border Radius</Label>
            <div className="px-2">
              <Slider
                value={[parseInt(getCurrentValue('buttonBorderRadius', '6').replace('px', ''))]}
                onValueChange={(value) => handleResponsiveUpdate('buttonBorderRadius', `${value[0]}px`)}
                max={50}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {getCurrentValue('buttonBorderRadius', '6px')}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Background */}
      <Collapsible open={openSections.background} onOpenChange={() => toggleSection('background')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Background</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.background ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div>
            <Label className="text-xs">Container Background</Label>
            <ColorPicker
              color={getCurrentValue('backgroundColor', 'auto')}
              onChange={(color) => handleResponsiveUpdate('backgroundColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Background Opacity</Label>
            <div className="px-2">
              <Slider
                value={[getCurrentValue('backgroundOpacity', 100)]}
                onValueChange={(value) => handleResponsiveUpdate('backgroundOpacity', value[0])}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {getCurrentValue('backgroundOpacity', 100)}%
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Border & Effects */}
      <Collapsible open={openSections.borders} onOpenChange={() => toggleSection('borders')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Border & Effects</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.borders ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div>
            <Label className="text-xs">Container Border Width</Label>
            <Input
              value={getCurrentValue('borderWidth', '')}
              onChange={(e) => handleResponsiveUpdate('borderWidth', e.target.value)}
              placeholder="e.g., 1px"
            />
          </div>

          <div>
            <Label className="text-xs">Container Border Color</Label>
            <ColorPicker
              color={getCurrentValue('borderColor', 'auto')}
              onChange={(color) => handleResponsiveUpdate('borderColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Container Border Radius</Label>
            <div className="px-2">
              <Slider
                value={[parseInt(getCurrentValue('borderRadius', '0').replace('px', ''))]}
                onValueChange={(value) => handleResponsiveUpdate('borderRadius', `${value[0]}px`)}
                max={50}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {getCurrentValue('borderRadius', '0px')}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Box Shadow</Label>
            <BoxShadowPicker
              value={getCurrentValue('boxShadow', 'none')}
              onChange={(shadow) => handleResponsiveUpdate('boxShadow', shadow)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Spacing */}
      <Collapsible open={openSections.spacing} onOpenChange={() => toggleSection('spacing')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.spacing ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div>
            <Label className="text-xs">Margin</Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Top</Label>
                <Input
                  value={getCurrentValue('marginTop', '')}
                  onChange={(e) => handleResponsiveUpdate('marginTop', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Right</Label>
                <Input
                  value={getCurrentValue('marginRight', '')}
                  onChange={(e) => handleResponsiveUpdate('marginRight', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bottom</Label>
                <Input
                  value={getCurrentValue('marginBottom', '')}
                  onChange={(e) => handleResponsiveUpdate('marginBottom', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Left</Label>
                <Input
                  value={getCurrentValue('marginLeft', '')}
                  onChange={(e) => handleResponsiveUpdate('marginLeft', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Padding</Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Top</Label>
                <Input
                  value={getCurrentValue('paddingTop', '')}
                  onChange={(e) => handleResponsiveUpdate('paddingTop', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Right</Label>
                <Input
                  value={getCurrentValue('paddingRight', '')}
                  onChange={(e) => handleResponsiveUpdate('paddingRight', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bottom</Label>
                <Input
                  value={getCurrentValue('paddingBottom', '')}
                  onChange={(e) => handleResponsiveUpdate('paddingBottom', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Left</Label>
                <Input
                  value={getCurrentValue('paddingLeft', '')}
                  onChange={(e) => handleResponsiveUpdate('paddingLeft', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};