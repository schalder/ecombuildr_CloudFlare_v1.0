import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ColorPicker } from '@/components/ui/color-picker';
import { ResponsiveSpacingSliders } from './_shared/ResponsiveSpacingSliders';
import { useDevicePreview } from '../../contexts/DevicePreviewContext';
import { PageBuilderElement } from '../types';
import { Type, Palette, Layout } from 'lucide-react';

interface FormElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const FormElementStyles: React.FC<FormElementStylesProps> = ({ 
  element, 
  onStyleUpdate 
}) => {
  const { deviceType } = useDevicePreview();

  // Helper functions for responsive values
  const getResponsiveValue = (property: string, defaultValue: any = '') => {
    return element.styles?.responsive?.[deviceType]?.[property] || 
           element.styles?.responsive?.desktop?.[property] || 
           defaultValue;
  };

  const updateResponsiveValue = (property: string, value: any) => {
    const responsive = element.styles?.responsive || {};
    const deviceStyles = responsive[deviceType] || {};
    
    onStyleUpdate('responsive', {
      ...responsive,
      [deviceType]: {
        ...deviceStyles,
        [property]: value
      }
    });
  };

  // Typography handlers
  const handleLabelFontSize = (value: number[]) => {
    updateResponsiveValue('labelFontSize', `${value[0]}px`);
  };

  const handleLabelFontWeight = (value: string) => {
    updateResponsiveValue('labelFontWeight', value);
  };

  const handlePlaceholderFontSize = (value: number[]) => {
    updateResponsiveValue('placeholderFontSize', `${value[0]}px`);
  };

  const handlePlaceholderFontWeight = (value: string) => {
    updateResponsiveValue('placeholderFontWeight', value);
  };

  const handleButtonFontSize = (value: number[]) => {
    updateResponsiveValue('buttonFontSize', `${value[0]}px`);
  };

  const handleButtonFontWeight = (value: string) => {
    updateResponsiveValue('buttonFontWeight', value);
  };

  // Color handlers
  const handleColorChange = (property: string, color: string) => {
    updateResponsiveValue(property, color);
  };

  // Layout handlers
  const handleFormWidth = (value: string) => {
    updateResponsiveValue('formWidth', value);
  };

  const handleFieldGap = (value: number[]) => {
    updateResponsiveValue('fieldGap', `${value[0]}px`);
  };

  const handleLabelAlignment = (value: string) => {
    updateResponsiveValue('labelAlignment', value);
  };

  const handleBorderWidth = (value: number[]) => {
    updateResponsiveValue('borderWidth', `${value[0]}px`);
  };

  const handleBorderRadius = (value: number[]) => {
    updateResponsiveValue('borderRadius', `${value[0]}px`);
  };

  // Spacing handlers
  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    const match = value.match(/(\d+(?:\.\d+)?)px/);
    return match ? parseFloat(match[1]) : 0;
  };

  const getCurrentSpacingByDevice = (property: string) => {
    const responsive = element.styles?.responsive || {};
    const deviceStyles = responsive[deviceType] || {};
    const desktopStyles = responsive.desktop || {};
    
    return {
      top: parsePixelValue(deviceStyles[`${property}Top`] || desktopStyles[`${property}Top`]),
      right: parsePixelValue(deviceStyles[`${property}Right`] || desktopStyles[`${property}Right`]),
      bottom: parsePixelValue(deviceStyles[`${property}Bottom`] || desktopStyles[`${property}Bottom`]),
      left: parsePixelValue(deviceStyles[`${property}Left`] || desktopStyles[`${property}Left`]),
    };
  };

  const handleMarginChange = (property: string, value: number) => {
    const responsive = element.styles?.responsive || {};
    const deviceStyles = responsive[deviceType] || {};
    
    onStyleUpdate('responsive', {
      ...responsive,
      [deviceType]: {
        ...deviceStyles,
        [`margin${property.charAt(0).toUpperCase() + property.slice(1)}`]: `${value}px`
      }
    });
  };

  const handlePaddingChange = (property: string, value: number) => {
    const responsive = element.styles?.responsive || {};
    const deviceStyles = responsive[deviceType] || {};
    
    onStyleUpdate('responsive', {
      ...responsive,
      [deviceType]: {
        ...deviceStyles,
        [`padding${property.charAt(0).toUpperCase() + property.slice(1)}`]: `${value}px`
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Typography Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Label Font */}
          <div>
            <Label className="text-sm font-medium">Field Label Font</Label>
            <div className="space-y-2 mt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <Slider
                  value={[parsePixelValue(getResponsiveValue('labelFontSize', '14px'))]}
                  onValueChange={handleLabelFontSize}
                  min={10}
                  max={24}
                  step={1}
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground text-center">
                  {getResponsiveValue('labelFontSize', '14px')}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Weight</Label>
                <Select 
                  value={getResponsiveValue('labelFontWeight', '500')} 
                  onValueChange={handleLabelFontWeight}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">Light</SelectItem>
                    <SelectItem value="400">Normal</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="600">Semi Bold</SelectItem>
                    <SelectItem value="700">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Placeholder Font */}
          <div>
            <Label className="text-sm font-medium">Placeholder Font</Label>
            <div className="space-y-2 mt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <Slider
                  value={[parsePixelValue(getResponsiveValue('placeholderFontSize', '14px'))]}
                  onValueChange={handlePlaceholderFontSize}
                  min={10}
                  max={24}
                  step={1}
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground text-center">
                  {getResponsiveValue('placeholderFontSize', '14px')}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Weight</Label>
                <Select 
                  value={getResponsiveValue('placeholderFontWeight', '400')} 
                  onValueChange={handlePlaceholderFontWeight}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">Light</SelectItem>
                    <SelectItem value="400">Normal</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="600">Semi Bold</SelectItem>
                    <SelectItem value="700">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Button Font */}
          <div>
            <Label className="text-sm font-medium">Button Font</Label>
            <div className="space-y-2 mt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <Slider
                  value={[parsePixelValue(getResponsiveValue('buttonFontSize', '16px'))]}
                  onValueChange={handleButtonFontSize}
                  min={10}
                  max={24}
                  step={1}
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground text-center">
                  {getResponsiveValue('buttonFontSize', '16px')}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Weight</Label>
                <Select 
                  value={getResponsiveValue('buttonFontWeight', '500')} 
                  onValueChange={handleButtonFontWeight}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">Light</SelectItem>
                    <SelectItem value="400">Normal</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="600">Semi Bold</SelectItem>
                    <SelectItem value="700">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Field Border</Label>
              <ColorPicker
                value={getResponsiveValue('fieldBorderColor', '#e5e7eb')}
                onChange={(color) => handleColorChange('fieldBorderColor', color)}
              />
            </div>
            <div>
              <Label className="text-sm">Form Label</Label>
              <ColorPicker
                value={getResponsiveValue('formLabelColor', '#374151')}
                onChange={(color) => handleColorChange('formLabelColor', color)}
              />
            </div>
            <div>
              <Label className="text-sm">Placeholder</Label>
              <ColorPicker
                value={getResponsiveValue('placeholderColor', '#9ca3af')}
                onChange={(color) => handleColorChange('placeholderColor', color)}
              />
            </div>
            <div>
              <Label className="text-sm">Input Text</Label>
              <ColorPicker
                value={getResponsiveValue('inputTextColor', '#000000')}
                onChange={(color) => handleColorChange('inputTextColor', color)}
              />
            </div>
            <div>
              <Label className="text-sm">Button Background</Label>
              <ColorPicker
                value={getResponsiveValue('buttonBg', '#3b82f6')}
                onChange={(color) => handleColorChange('buttonBg', color)}
              />
            </div>
            <div>
              <Label className="text-sm">Button Text</Label>
              <ColorPicker
                value={getResponsiveValue('buttonText', '#ffffff')}
                onChange={(color) => handleColorChange('buttonText', color)}
              />
            </div>
            <div>
              <Label className="text-sm">Button Hover Background</Label>
              <ColorPicker
                value={getResponsiveValue('buttonHoverBg', '#2563eb')}
                onChange={(color) => handleColorChange('buttonHoverBg', color)}
              />
            </div>
            <div>
              <Label className="text-sm">Button Hover Text</Label>
              <ColorPicker
                value={getResponsiveValue('buttonHoverText', '#ffffff')}
                onChange={(color) => handleColorChange('buttonHoverText', color)}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-sm">Form Background</Label>
              <ColorPicker
                value={getResponsiveValue('formBackgroundColor', 'transparent')}
                onChange={(color) => handleColorChange('formBackgroundColor', color)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout & Spacing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form Width */}
          <div>
            <Label className="text-sm font-medium">Form Width</Label>
            <Select 
              value={getResponsiveValue('formWidth', 'full')} 
              onValueChange={handleFormWidth}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Width</SelectItem>
                <SelectItem value="75%">75% Width</SelectItem>
                <SelectItem value="50%">50% Width</SelectItem>
                <SelectItem value="25%">25% Width</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Gap */}
          <div>
            <Label className="text-sm font-medium">Field Gap</Label>
            <Slider
              value={[parsePixelValue(getResponsiveValue('fieldGap', '16px'))]}
              onValueChange={handleFieldGap}
              min={0}
              max={40}
              step={2}
              className="mt-2"
            />
            <div className="text-xs text-muted-foreground text-center">
              {getResponsiveValue('fieldGap', '16px')}
            </div>
          </div>

          {/* Label Alignment */}
          <div>
            <Label className="text-sm font-medium">Label Alignment</Label>
            <Select 
              value={getResponsiveValue('labelAlignment', 'left')} 
              onValueChange={handleLabelAlignment}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Border Width */}
          <div>
            <Label className="text-sm font-medium">Form Border Width</Label>
            <Slider
              value={[parsePixelValue(getResponsiveValue('borderWidth', '0px'))]}
              onValueChange={handleBorderWidth}
              min={0}
              max={10}
              step={1}
              className="mt-2"
            />
            <div className="text-xs text-muted-foreground text-center">
              {getResponsiveValue('borderWidth', '0px')}
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <Label className="text-sm font-medium">Form Corner Radius</Label>
            <Slider
              value={[parsePixelValue(getResponsiveValue('borderRadius', '8px'))]}
              onValueChange={handleBorderRadius}
              min={0}
              max={20}
              step={1}
              className="mt-2"
            />
            <div className="text-xs text-muted-foreground text-center">
              {getResponsiveValue('borderRadius', '8px')}
            </div>
          </div>

          {/* Border Color */}
          <div>
            <Label className="text-sm font-medium">Form Border Color</Label>
            <ColorPicker
              value={getResponsiveValue('borderColor', '#e5e7eb')}
              onChange={(color) => handleColorChange('borderColor', color)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Element Spacing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Element Spacing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveSpacingSliders
            element={element}
            onUpdate={onStyleUpdate}
            getCurrentSpacing={getCurrentSpacingByDevice}
            handleMarginChange={handleMarginChange}
            handlePaddingChange={handlePaddingChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};