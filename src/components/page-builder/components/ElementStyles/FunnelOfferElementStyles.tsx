import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Smartphone } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { BoxShadowPicker } from '@/components/ui/box-shadow-picker';
import { PageBuilderElement } from '../../types';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';
import { ResponsiveSpacingSliders } from './_shared/ResponsiveSpacingSliders';

interface FunnelOfferElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const FunnelOfferElementStyles: React.FC<FunnelOfferElementStylesProps> = ({
  element,
  onStyleUpdate
}) => {
  const [responsiveTab, setResponsiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [cardOpen, setCardOpen] = useState(true);
  const [titleOpen, setTitleOpen] = useState(false);
  const [buttonOpen, setButtonOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);

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

  // Helper functions for device-aware spacing conversion
  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', '')) || 0;
  };

  const getCurrentSpacingByDevice = () => {
    const marginByDevice = element.styles?.marginByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    
    const paddingByDevice = element.styles?.paddingByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };

    // Convert legacy spacing to device-aware if needed
    if (!element.styles?.marginByDevice && (element.styles?.marginTop || element.styles?.marginRight || element.styles?.marginBottom || element.styles?.marginLeft)) {
      marginByDevice.desktop = {
        top: parsePixelValue(element.styles?.marginTop),
        right: parsePixelValue(element.styles?.marginRight),
        bottom: parsePixelValue(element.styles?.marginBottom),
        left: parsePixelValue(element.styles?.marginLeft)
      };
    }

    if (!element.styles?.paddingByDevice && (element.styles?.paddingTop || element.styles?.paddingRight || element.styles?.paddingBottom || element.styles?.paddingLeft)) {
      paddingByDevice.desktop = {
        top: parsePixelValue(element.styles?.paddingTop),
        right: parsePixelValue(element.styles?.paddingRight),
        bottom: parsePixelValue(element.styles?.paddingBottom),
        left: parsePixelValue(element.styles?.paddingLeft)
      };
    }

    return { marginByDevice, paddingByDevice };
  };

  const handleMarginChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const { marginByDevice } = getCurrentSpacingByDevice();
    const updated = { ...marginByDevice };
    updated[device] = { ...updated[device], [property]: value };
    onStyleUpdate('marginByDevice', updated);
  };

  const handlePaddingChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const { paddingByDevice } = getCurrentSpacingByDevice();
    const updated = { ...paddingByDevice };
    updated[device] = { ...updated[device], [property]: value };
    onStyleUpdate('paddingByDevice', updated);
  };

  return (
    <div className="space-y-4">
      {/* Device Toggle */}
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

      {/* Card Container */}
      <CollapsibleGroup title="Card Container" isOpen={cardOpen} onToggle={setCardOpen}>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Background Color</Label>
            <ColorPicker
              color={getCurrentValue('backgroundColor', '#ffffff')}
              onChange={(color) => handleResponsiveUpdate('backgroundColor', color)}
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
            <Label className="text-xs">Border Width</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(getCurrentValue('borderWidth', '1px').replace(/\D/g, ''))]}
                onValueChange={(value) => handleResponsiveUpdate('borderWidth', `${value[0]}px`)}
                max={10}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {getCurrentValue('borderWidth', '1px')}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Border Radius</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(getCurrentValue('borderRadius', '8px').replace(/\D/g, ''))]}
                onValueChange={(value) => handleResponsiveUpdate('borderRadius', `${value[0]}px`)}
                max={50}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {getCurrentValue('borderRadius', '8px')}
              </span>
            </div>
          </div>

          <div>
            <BoxShadowPicker
              value={getCurrentValue('boxShadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')}
              onChange={(value) => handleResponsiveUpdate('boxShadow', value)}
              label="Box Shadow"
            />
          </div>

          <div>
            <Label className="text-xs">Max Width</Label>
            <Input
              value={getCurrentValue('maxWidth', '600px')}
              onChange={(e) => handleResponsiveUpdate('maxWidth', e.target.value)}
              placeholder="600px"
            />
          </div>
        </div>
      </CollapsibleGroup>

      {/* Title Styles */}
      <CollapsibleGroup title="Title Styles" isOpen={titleOpen} onToggle={setTitleOpen}>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Font Size</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(getCurrentValue('titleFontSize', '24px').replace(/\D/g, ''))]}
                onValueChange={(value) => handleResponsiveUpdate('titleFontSize', `${value[0]}px`)}
                max={60}
                min={12}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-16">
                {getCurrentValue('titleFontSize', '24px')}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Font Weight</Label>
            <Select
              value={getCurrentValue('titleFontWeight', 'bold')}
              onValueChange={(value) => handleResponsiveUpdate('titleFontWeight', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="semibold">Semibold</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Text Color</Label>
            <ColorPicker
              color={getCurrentValue('titleColor', '#1f2937')}
              onChange={(color) => handleResponsiveUpdate('titleColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Text Align</Label>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant={getCurrentValue('titleTextAlign', 'center') === 'left' ? 'default' : 'outline'}
                onClick={() => handleResponsiveUpdate('titleTextAlign', 'left')}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={getCurrentValue('titleTextAlign', 'center') === 'center' ? 'default' : 'outline'}
                onClick={() => handleResponsiveUpdate('titleTextAlign', 'center')}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={getCurrentValue('titleTextAlign', 'center') === 'right' ? 'default' : 'outline'}
                onClick={() => handleResponsiveUpdate('titleTextAlign', 'right')}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleGroup>

      {/* Button Styles */}
      <CollapsibleGroup title="Accept Button Styles" isOpen={buttonOpen} onToggle={setButtonOpen}>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Background Color</Label>
            <ColorPicker
              color={getCurrentValue('buttonBackgroundColor', '#10b981')}
              onChange={(color) => handleResponsiveUpdate('buttonBackgroundColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Text Color</Label>
            <ColorPicker
              color={getCurrentValue('buttonTextColor', '#ffffff')}
              onChange={(color) => handleResponsiveUpdate('buttonTextColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Hover Background</Label>
            <ColorPicker
              color={getCurrentValue('buttonHoverBackgroundColor', '#059669')}
              onChange={(color) => handleResponsiveUpdate('buttonHoverBackgroundColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Font Size</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(getCurrentValue('buttonFontSize', '16px').replace(/\D/g, ''))]}
                onValueChange={(value) => handleResponsiveUpdate('buttonFontSize', `${value[0]}px`)}
                max={24}
                min={12}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-16">
                {getCurrentValue('buttonFontSize', '16px')}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Font Weight</Label>
            <Select
              value={getCurrentValue('buttonFontWeight', 'semibold')}
              onValueChange={(value) => handleResponsiveUpdate('buttonFontWeight', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="semibold">Semibold</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Border Radius</Label>
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

          <div>
            <Label className="text-xs">Height</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(getCurrentValue('buttonHeight', '56px').replace(/\D/g, ''))]}
                onValueChange={(value) => handleResponsiveUpdate('buttonHeight', `${value[0]}px`)}
                max={80}
                min={32}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-16">
                {getCurrentValue('buttonHeight', '56px')}
              </span>
            </div>
          </div>
        </div>
      </CollapsibleGroup>

      {/* Decline Link Styles */}
      <CollapsibleGroup title="Decline Link Styles" isOpen={linkOpen} onToggle={setLinkOpen}>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Text Color</Label>
            <ColorPicker
              color={getCurrentValue('linkTextColor', '#6b7280')}
              onChange={(color) => handleResponsiveUpdate('linkTextColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Hover Color</Label>
            <ColorPicker
              color={getCurrentValue('linkHoverColor', '#374151')}
              onChange={(color) => handleResponsiveUpdate('linkHoverColor', color)}
            />
          </div>

          <div>
            <Label className="text-xs">Font Size</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(getCurrentValue('linkFontSize', '14px').replace(/\D/g, ''))]}
                onValueChange={(value) => handleResponsiveUpdate('linkFontSize', `${value[0]}px`)}
                max={20}
                min={10}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-16">
                {getCurrentValue('linkFontSize', '14px')}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Text Decoration</Label>
            <Select
              value={getCurrentValue('linkTextDecoration', 'underline')}
              onValueChange={(value) => handleResponsiveUpdate('linkTextDecoration', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="underline">Underline</SelectItem>
                <SelectItem value="line-through">Line Through</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleGroup>

      {/* Spacing */}
      <CollapsibleGroup title="Spacing" isOpen={spacingOpen} onToggle={setSpacingOpen}>
        <ResponsiveSpacingSliders
          marginByDevice={getCurrentSpacingByDevice().marginByDevice}
          paddingByDevice={getCurrentSpacingByDevice().paddingByDevice}
          onMarginChange={handleMarginChange}
          onPaddingChange={handlePaddingChange}
        />
      </CollapsibleGroup>
    </div>
  );
};