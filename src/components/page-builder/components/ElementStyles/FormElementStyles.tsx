import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { ResponsiveSpacingSliders } from './_shared/ResponsiveSpacingSliders';
import { useDevicePreview } from '../../contexts/DevicePreviewContext';
import { PageBuilderElement } from '../../types';
import { Type, Palette, Layout, AlignLeft, Square, MessageSquare, MousePointer, Container } from 'lucide-react';

interface FormElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const FormElementStyles: React.FC<FormElementStylesProps> = ({
  element,
  onStyleUpdate 
}) => {
  const { deviceType } = useDevicePreview();
  
  // State for collapsible sections (all collapsed by default)
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [placeholdersOpen, setPlaceholdersOpen] = useState(false);
  const [buttonOpen, setButtonOpen] = useState(false);
  const [containerOpen, setContainerOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);

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

  // Input field handlers for manual value entry
  const createInputHandler = (property: string, min: number, max: number) => (value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(min, Math.min(max, numValue));
    updateResponsiveValue(property, `${clampedValue}px`);
  };

  // Spacing handlers for ResponsiveSpacingSliders
  const handleMarginChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const marginByDevice = element.styles?.marginByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    const updated = { ...marginByDevice };
    updated[device] = { ...updated[device], [property]: value };
    onStyleUpdate('marginByDevice', updated);
  };

  const handlePaddingChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const paddingByDevice = element.styles?.paddingByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    const updated = { ...paddingByDevice };
    updated[device] = { ...updated[device], [property]: value };
    onStyleUpdate('paddingByDevice', updated);
  };

  return (
    <div className="space-y-4">
      {/* 📄 LABELS SECTION */}
      <CollapsibleGroup
        title="Labels"
        isOpen={labelsOpen}
        onToggle={setLabelsOpen}
      >
        <div className="space-y-4">
          {/* Label Color */}
          <div>
            <Label className="text-sm">Label Color</Label>
            <ColorPicker
              color={getResponsiveValue('formLabelColor', '#374151')}
              onChange={(color) => updateResponsiveValue('formLabelColor', color)}
            />
          </div>

          {/* Label Font Size */}
        <div>
            <Label className="text-sm">Label Font Size</Label>
            <Slider
              value={[parseInt(getResponsiveValue('labelFontSize', '14'))]}
              onValueChange={(value) => updateResponsiveValue('labelFontSize', `${value[0]}px`)}
              max={32}
              min={8}
              step={1}
              className="mt-2"
            />
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                min="8"
                max="32"
                value={parseInt(getResponsiveValue('labelFontSize', '14'))}
                onChange={(e) => createInputHandler('labelFontSize', 8, 32)(e.target.value)}
                className="w-20 h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">8px</span>
              <span className="text-xs text-muted-foreground">{getResponsiveValue('labelFontSize', '14')}</span>
              <span className="text-xs text-muted-foreground">32px</span>
            </div>
          </div>

          {/* Label Font Weight */}
          <div>
            <Label className="text-sm">Label Font Weight</Label>
            <Select
              value={getResponsiveValue('labelFontWeight', '500')}
              onValueChange={(value) => updateResponsiveValue('labelFontWeight', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="300">Light</SelectItem>
                <SelectItem value="400">Normal</SelectItem>
                <SelectItem value="500">Medium</SelectItem>
                <SelectItem value="600">Semi-Bold</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Label Alignment */}
          <div>
            <Label className="text-sm">Label Alignment</Label>
            <Select
              value={getResponsiveValue('labelAlignment', 'left')}
              onValueChange={(value) => updateResponsiveValue('labelAlignment', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleGroup>

      {/* 📄 FIELDS SECTION */}
      <CollapsibleGroup
        title="Fields"
        isOpen={fieldsOpen}
        onToggle={setFieldsOpen}
      >
        <div className="space-y-4">
          {/* Field Border Color */}
          <div>
            <Label className="text-sm">Field Border Color</Label>
            <ColorPicker
              color={getResponsiveValue('fieldBorderColor', '#e5e7eb')}
              onChange={(color) => updateResponsiveValue('fieldBorderColor', color)}
            />
          </div>

          {/* Field Border Width */}
          <div>
            <Label className="text-sm">Field Border Width</Label>
            <Slider
              value={[parseInt(getResponsiveValue('fieldBorderWidth', '1'))]}
              onValueChange={(value) => updateResponsiveValue('fieldBorderWidth', `${value[0]}px`)}
              max={10}
              min={0}
              step={1}
              className="mt-2"
            />
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                min="0"
                max="10"
                value={parseInt(getResponsiveValue('fieldBorderWidth', '1'))}
                onChange={(e) => createInputHandler('fieldBorderWidth', 0, 10)(e.target.value)}
                className="w-20 h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">0px</span>
              <span className="text-xs text-muted-foreground">{getResponsiveValue('fieldBorderWidth', '1')}</span>
              <span className="text-xs text-muted-foreground">10px</span>
          </div>
        </div>

          {/* Field Corner Radius */}
        <div>
            <Label className="text-sm">Field Corner Radius</Label>
            <Slider
              value={[parseInt(getResponsiveValue('fieldBorderRadius', '6'))]}
              onValueChange={(value) => updateResponsiveValue('fieldBorderRadius', `${value[0]}px`)}
              max={50}
              min={0}
              step={1}
              className="mt-2"
            />
            <div className="flex items-center gap-2 mt-2">
          <Input
                type="number"
                min="0"
                max="50"
                value={parseInt(getResponsiveValue('fieldBorderRadius', '6'))}
                onChange={(e) => createInputHandler('fieldBorderRadius', 0, 50)(e.target.value)}
                className="w-20 h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">0px</span>
              <span className="text-xs text-muted-foreground">{getResponsiveValue('fieldBorderRadius', '6')}</span>
              <span className="text-xs text-muted-foreground">50px</span>
            </div>
          </div>

          {/* Input Text Color */}
          <div>
            <Label className="text-sm">Input Text Color</Label>
            <ColorPicker
              color={getResponsiveValue('inputTextColor', '#000000')}
              onChange={(color) => updateResponsiveValue('inputTextColor', color)}
            />
          </div>

          {/* Field Background Color */}
          <div>
            <Label className="text-sm">Field Background Color</Label>
            <ColorPicker
              color={getResponsiveValue('fieldBackground', 'transparent')}
              onChange={(color) => updateResponsiveValue('fieldBackground', color)}
            />
          </div>
        </div>
      </CollapsibleGroup>

      {/* 💬 PLACEHOLDERS SECTION */}
      <CollapsibleGroup
        title="Placeholders"
        isOpen={placeholdersOpen}
        onToggle={setPlaceholdersOpen}
      >
        <div className="space-y-4">
          {/* Placeholder Color */}
          <div>
            <Label className="text-sm">Placeholder Color</Label>
            <ColorPicker
              color={getResponsiveValue('placeholderColor', '#9ca3af')}
              onChange={(color) => updateResponsiveValue('placeholderColor', color)}
            />
          </div>

          {/* Placeholder Font Size */}
        <div>
            <Label className="text-sm">Placeholder Font Size</Label>
            <Slider
              value={[parseInt(getResponsiveValue('placeholderFontSize', '14'))]}
              onValueChange={(value) => updateResponsiveValue('placeholderFontSize', `${value[0]}px`)}
              max={32}
              min={8}
              step={1}
              className="mt-2"
            />
            <div className="flex items-center gap-2 mt-2">
          <Input
                type="number"
                min="8"
                max="32"
                value={parseInt(getResponsiveValue('placeholderFontSize', '14'))}
                onChange={(e) => createInputHandler('placeholderFontSize', 8, 32)(e.target.value)}
                className="w-20 h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">8px</span>
              <span className="text-xs text-muted-foreground">{getResponsiveValue('placeholderFontSize', '14')}</span>
              <span className="text-xs text-muted-foreground">32px</span>
            </div>
          </div>

          {/* Placeholder Font Weight */}
          <div>
            <Label className="text-sm">Placeholder Font Weight</Label>
            <Select
              value={getResponsiveValue('placeholderFontWeight', '400')}
              onValueChange={(value) => updateResponsiveValue('placeholderFontWeight', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="300">Light</SelectItem>
                <SelectItem value="400">Normal</SelectItem>
                <SelectItem value="500">Medium</SelectItem>
                <SelectItem value="600">Semi-Bold</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleGroup>

      {/* 🔘 BUTTON SECTION */}
      <CollapsibleGroup
        title="Button"
        isOpen={buttonOpen}
        onToggle={setButtonOpen}
      >
        <div className="space-y-4">
          {/* Button Background */}
          <div>
            <Label className="text-sm">Button Background</Label>
            <ColorPicker
              color={getResponsiveValue('buttonBg', '#3b82f6')}
              onChange={(color) => updateResponsiveValue('buttonBg', color)}
            />
          </div>

          {/* Button Text Color */}
        <div>
            <Label className="text-sm">Button Text Color</Label>
            <ColorPicker
              color={getResponsiveValue('buttonText', '#ffffff')}
              onChange={(color) => updateResponsiveValue('buttonText', color)}
          />
        </div>

          {/* Button Font Size */}
        <div>
            <Label className="text-sm">Button Font Size</Label>
            <Slider
              value={[parseInt(getResponsiveValue('buttonFontSize', '16'))]}
              onValueChange={(value) => updateResponsiveValue('buttonFontSize', `${value[0]}px`)}
              max={32}
              min={8}
              step={1}
              className="mt-2"
            />
            <div className="flex items-center gap-2 mt-2">
          <Input
                type="number"
                min="8"
                max="32"
                value={parseInt(getResponsiveValue('buttonFontSize', '16'))}
                onChange={(e) => createInputHandler('buttonFontSize', 8, 32)(e.target.value)}
                className="w-20 h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">8px</span>
              <span className="text-xs text-muted-foreground">{getResponsiveValue('buttonFontSize', '16')}</span>
              <span className="text-xs text-muted-foreground">32px</span>
            </div>
          </div>

          {/* Button Font Weight */}
          <div>
            <Label className="text-sm">Button Font Weight</Label>
            <Select
              value={getResponsiveValue('buttonFontWeight', '500')}
              onValueChange={(value) => updateResponsiveValue('buttonFontWeight', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="300">Light</SelectItem>
                <SelectItem value="400">Normal</SelectItem>
                <SelectItem value="500">Medium</SelectItem>
                <SelectItem value="600">Semi-Bold</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Button Hover Background */}
          <div>
            <Label className="text-sm">Button Hover Background</Label>
            <ColorPicker
              color={getResponsiveValue('buttonHoverBg', '#2563eb')}
              onChange={(color) => updateResponsiveValue('buttonHoverBg', color)}
          />
        </div>

          {/* Button Hover Text Color */}
          <div>
            <Label className="text-sm">Button Hover Text Color</Label>
            <ColorPicker
              color={getResponsiveValue('buttonHoverText', '#ffffff')}
              onChange={(color) => updateResponsiveValue('buttonHoverText', color)}
            />
          </div>
        </div>
      </CollapsibleGroup>

      {/* 📦 FORM CONTAINER SECTION */}
      <CollapsibleGroup
        title="Form Container"
        isOpen={containerOpen}
        onToggle={setContainerOpen}
      >
        <div className="space-y-4">
          {/* Form Background Color */}
          <div>
            <Label className="text-sm">Form Background Color</Label>
            <ColorPicker
              color={getResponsiveValue('formBackground', 'transparent')}
              onChange={(color) => updateResponsiveValue('formBackground', color)}
            />
          </div>

          {/* Form Border Color */}
          <div>
            <Label className="text-sm">Form Border Color</Label>
            <ColorPicker
              color={getResponsiveValue('formBorderColor', 'transparent')}
              onChange={(color) => updateResponsiveValue('formBorderColor', color)}
            />
          </div>

          {/* Form Border Width */}
          <div>
            <Label className="text-sm">Form Border Width</Label>
            <Slider
              value={[parseInt(getResponsiveValue('formBorderWidth', '0'))]}
              onValueChange={(value) => updateResponsiveValue('formBorderWidth', `${value[0]}px`)}
              max={10}
              min={0}
              step={1}
              className="mt-2"
            />
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                min="0"
                max="10"
                value={parseInt(getResponsiveValue('formBorderWidth', '0'))}
                onChange={(e) => createInputHandler('formBorderWidth', 0, 10)(e.target.value)}
                className="w-20 h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">0px</span>
              <span className="text-xs text-muted-foreground">{getResponsiveValue('formBorderWidth', '0')}</span>
              <span className="text-xs text-muted-foreground">10px</span>
            </div>
          </div>

          {/* Form Corner Radius */}
          <div>
            <Label className="text-sm">Form Corner Radius</Label>
            <Slider
              value={[parseInt(getResponsiveValue('formBorderRadius', '8'))]}
              onValueChange={(value) => updateResponsiveValue('formBorderRadius', `${value[0]}px`)}
              max={50}
              min={0}
              step={1}
              className="mt-2"
            />
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                min="0"
                max="50"
                value={parseInt(getResponsiveValue('formBorderRadius', '8'))}
                onChange={(e) => createInputHandler('formBorderRadius', 0, 50)(e.target.value)}
                className="w-20 h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">0px</span>
              <span className="text-xs text-muted-foreground">{getResponsiveValue('formBorderRadius', '8')}</span>
              <span className="text-xs text-muted-foreground">50px</span>
            </div>
          </div>

          {/* Form Width */}
          <div>
            <Label className="text-sm">Form Width</Label>
            <Select
              value={getResponsiveValue('formWidth', 'full')}
              onValueChange={(value) => updateResponsiveValue('formWidth', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select width" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Width</SelectItem>
                <SelectItem value="75%">3/4 Width</SelectItem>
                <SelectItem value="50%">Half Width</SelectItem>
                <SelectItem value="25%">1/4 Width</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Gap */}
        <div>
            <Label className="text-sm">Field Gap</Label>
            <Slider
              value={[parseInt(getResponsiveValue('fieldGap', '16'))]}
              onValueChange={(value) => updateResponsiveValue('fieldGap', `${value[0]}px`)}
              max={64}
              min={0}
              step={1}
              className="mt-2"
            />
            <div className="flex items-center gap-2 mt-2">
          <Input
                type="number"
                min="0"
                max="64"
                value={parseInt(getResponsiveValue('fieldGap', '16'))}
                onChange={(e) => createInputHandler('fieldGap', 0, 64)(e.target.value)}
                className="w-20 h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">0px</span>
              <span className="text-xs text-muted-foreground">{getResponsiveValue('fieldGap', '16')}</span>
              <span className="text-xs text-muted-foreground">64px</span>
            </div>
          </div>
        </div>
      </CollapsibleGroup>

      {/* 📏 SPACING SECTION */}
      <CollapsibleGroup
        title="Spacing"
        isOpen={spacingOpen}
        onToggle={setSpacingOpen}
      >
        <ResponsiveSpacingSliders
          marginByDevice={element.styles?.marginByDevice}
          paddingByDevice={element.styles?.paddingByDevice}
          onMarginChange={handleMarginChange}
          onPaddingChange={handlePaddingChange}
        />
      </CollapsibleGroup>
    </div>
  );
};