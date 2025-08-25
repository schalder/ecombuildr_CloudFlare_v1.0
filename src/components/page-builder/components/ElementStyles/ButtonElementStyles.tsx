import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Smartphone, Palette, ChevronDown } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilderElement } from '../../types';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';

interface ButtonElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

// Professional button presets with modern designs
const buttonPresets = {
  default_solid: {
    name: 'Default (Solid)',
    description: 'Default button with solid background',
    styles: {
      backgroundColor: 'hsl(142 76% 36%)',
      color: 'hsl(0 0% 100%)',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '16px',
      padding: '12px 24px',
      borderWidth: '0px',
      hoverBackgroundColor: 'hsl(142 76% 32%)',
      boxShadow: '0 2px 8px hsl(142 76% 36% / 0.2)',
      transition: 'all 0.3s ease',
      textAlign: 'center'
    }
  },
  modern_primary: {
    name: 'Modern Primary',
    description: 'Clean, modern primary button',
    styles: {
      backgroundColor: 'hsl(217 91% 60%)',
      color: 'hsl(0 0% 100%)',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '15px',
      padding: '12px 24px',
      borderWidth: '0px',
      hoverBackgroundColor: 'hsl(217 91% 55%)',
      boxShadow: '0 4px 14px hsl(217 91% 60% / 0.3)',
      transition: 'all 0.3s ease'
    }
  },
  gradient_success: {
    name: 'Gradient Success',
    description: 'Success button with gradient',
    styles: {
      backgroundColor: 'hsl(142 76% 36%)',
      backgroundImage: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 46%))',
      color: 'hsl(0 0% 100%)',
      borderRadius: '10px',
      fontWeight: '600',
      fontSize: '15px',
      padding: '14px 28px',
      borderWidth: '0px',
      boxShadow: '0 6px 20px hsl(142 76% 36% / 0.4)',
      transition: 'all 0.3s ease',
      hoverBackgroundImage: 'linear-gradient(135deg, hsl(142 76% 32%), hsl(142 76% 42%))'
    }
  },
  premium_dark: {
    name: 'Premium Dark',
    description: 'Dark luxury button',
    styles: {
      backgroundColor: 'hsl(222 84% 5%)',
      color: 'hsl(0 0% 100%)',
      borderRadius: '10px',
      fontWeight: '600',
      fontSize: '15px',
      padding: '14px 28px',
      borderWidth: '1px',
      borderColor: 'hsl(215 28% 17%)',
      hoverBackgroundColor: 'hsl(222 84% 10%)',
      boxShadow: '0 8px 25px hsl(222 84% 5% / 0.5)',
      transition: 'all 0.3s ease'
    }
  },
  vibrant_accent: {
    name: 'Vibrant Accent',
    description: 'Eye-catching accent button',
    styles: {
      backgroundColor: 'hsl(271 91% 65%)',
      backgroundImage: 'linear-gradient(135deg, hsl(271 91% 65%), hsl(312 73% 57%))',
      color: 'hsl(0 0% 100%)',
      borderRadius: '12px',
      fontWeight: '700',
      fontSize: '16px',
      padding: '16px 32px',
      borderWidth: '0px',
      boxShadow: '0 8px 32px hsl(271 91% 65% / 0.4)',
      transition: 'all 0.3s ease',
      hoverBackgroundImage: 'linear-gradient(135deg, hsl(271 91% 60%), hsl(312 73% 52%))'
    }
  },
  minimal_ghost: {
    name: 'Minimal Ghost',
    description: 'Clean minimal button',
    styles: {
      backgroundColor: 'transparent',
      color: 'hsl(215 16% 47%)',
      borderRadius: '6px',
      fontWeight: '500',
      fontSize: '14px',
      padding: '10px 20px',
      borderWidth: '0px',
      hoverBackgroundColor: 'hsl(210 40% 96%)',
      hoverColor: 'hsl(222 84% 5%)',
      transition: 'all 0.2s ease'
    }
  },
  warning: {
    name: 'Warning',
    description: 'Warning action button',
    styles: {
      backgroundColor: 'hsl(38 92% 50%)',
      color: 'hsl(0 0% 100%)',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '15px',
      padding: '12px 24px',
      borderWidth: '0px',
      hoverBackgroundColor: 'hsl(38 92% 45%)',
      boxShadow: '0 4px 14px hsl(38 92% 50% / 0.3)',
      transition: 'all 0.3s ease'
    }
  },
  destructive: {
    name: 'Destructive',
    description: 'Destructive action button',
    styles: {
      backgroundColor: 'hsl(0 84% 60%)',
      color: 'hsl(0 0% 100%)',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '15px',
      padding: '12px 24px',
      borderWidth: '0px',
      hoverBackgroundColor: 'hsl(0 84% 55%)',
      boxShadow: '0 4px 14px hsl(0 84% 60% / 0.3)',
      transition: 'all 0.3s ease'
    }
  }
};

// Gradient presets for gradient mode
const gradientPresets = {
  purple_pink: {
    name: 'Purple → Pink',
    gradient: 'linear-gradient(135deg, hsl(271 91% 65%), hsl(312 73% 57%))',
    hoverGradient: 'linear-gradient(135deg, hsl(271 91% 60%), hsl(312 73% 52%))'
  },
  blue_cyan: {
    name: 'Blue → Cyan',
    gradient: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(187 85% 53%))',
    hoverGradient: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(187 85% 48%))'
  },
  green_teal: {
    name: 'Green → Teal',
    gradient: 'linear-gradient(135deg, hsl(142 76% 46%), hsl(173 58% 39%))',
    hoverGradient: 'linear-gradient(135deg, hsl(142 76% 42%), hsl(173 58% 35%))'
  },
  sunset: {
    name: 'Sunset',
    gradient: 'linear-gradient(135deg, hsl(38 92% 50%), hsl(0 84% 60%))',
    hoverGradient: 'linear-gradient(135deg, hsl(38 92% 45%), hsl(0 84% 55%))'
  }
};

export const ButtonElementStyles: React.FC<ButtonElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  const [responsiveTab, setResponsiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [dimensionsOpen, setDimensionsOpen] = useState(false);
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [bordersOpen, setBordersOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState<'solid' | 'gradient'>('solid');

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

  // Apply preset styles
  const applyPreset = (presetKey: string) => {
    const preset = buttonPresets[presetKey as keyof typeof buttonPresets];
    if (!preset) return;

    // Apply all preset styles to the current responsive view
    const updatedResponsive = {
      ...responsiveStyles,
      [responsiveTab]: {
        ...currentStyles,
        ...preset.styles
      }
    };
    onStyleUpdate('responsive', updatedResponsive);
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

      {/* Button Presets */}
      <CollapsibleGroup title="Button Presets" isOpen={presetsOpen} onToggle={setPresetsOpen}>
        <div className="space-y-3">
          <Label className="text-xs">Choose a preset style</Label>
          <Select onValueChange={applyPreset}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a preset..." />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border shadow-lg z-50">
              {Object.entries(buttonPresets).map(([key, preset]) => (
                <SelectItem key={key} value={key} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Palette className="h-3 w-3" />
                    <div>
                      <div className="font-medium text-xs">{preset.name}</div>
                      <div className="text-xs text-muted-foreground">{preset.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Presets apply styles to the current device view. All styles remain fully editable below.
          </p>
        </div>
      </CollapsibleGroup>

      {/* Dimensions */}
      <CollapsibleGroup title="Dimensions" isOpen={dimensionsOpen} onToggle={setDimensionsOpen}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Full Width</Label>
            <Switch
              checked={getCurrentValue('width') === '100%'}
              onCheckedChange={(checked) => handleResponsiveUpdate('width', checked ? '100%' : 'auto')}
            />
          </div>

          {getCurrentValue('width') !== '100%' && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Width</Label>
                <Input
                  value={getCurrentValue('width', 'auto')}
                  onChange={(e) => handleResponsiveUpdate('width', e.target.value)}
                  placeholder="e.g., 200px, 50%, auto"
                />
              </div>

              <div>
                <Label className="text-xs">Min Width</Label>
                <Input
                  value={getCurrentValue('minWidth')}
                  onChange={(e) => handleResponsiveUpdate('minWidth', e.target.value)}
                  placeholder="e.g., 120px, 20%"
                />
              </div>

              <div>
                <Label className="text-xs">Max Width</Label>
                <Input
                  value={getCurrentValue('maxWidth')}
                  onChange={(e) => handleResponsiveUpdate('maxWidth', e.target.value)}
                  placeholder="e.g., 300px, 80%"
                />
              </div>
            </div>
          )}
        </div>
      </CollapsibleGroup>

      {/* Typography */}
      <CollapsibleGroup title="Typography" isOpen={typographyOpen} onToggle={setTypographyOpen}>
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
      </CollapsibleGroup>

      {/* Colors */}
      <CollapsibleGroup title="Colors" isOpen={colorsOpen} onToggle={setColorsOpen}>
        <div>
          <Label className="text-xs">Text Color</Label>
          <ColorPicker
            color={getCurrentValue('color', '#ffffff')}
            onChange={(color) => handleResponsiveUpdate('color', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Text Hover Color</Label>
          <ColorPicker
            color={getCurrentValue('hoverColor', '')}
            onChange={(color) => handleResponsiveUpdate('hoverColor', color)}
          />
        </div>

        {/* Background Mode Toggle */}
        <div className="space-y-3">
          <Label className="text-xs">Background Mode</Label>
          <Tabs value={backgroundMode} onValueChange={(value) => {
            setBackgroundMode(value as 'solid' | 'gradient');
            if (value === 'solid') {
              handleResponsiveUpdate('backgroundImage', '');
              handleResponsiveUpdate('hoverBackgroundImage', '');
            }
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="solid">Solid</TabsTrigger>
              <TabsTrigger value="gradient">Gradient</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Solid Mode Controls */}
        {backgroundMode === 'solid' && (
          <>
            <div>
              <Label className="text-xs">Background Color</Label>
              <ColorPicker
                color={getCurrentValue('backgroundColor', '#3b82f6')}
                onChange={(color) => handleResponsiveUpdate('backgroundColor', color)}
              />
            </div>

            <div>
              <Label className="text-xs">Background Hover Color</Label>
              <ColorPicker
                color={getCurrentValue('hoverBackgroundColor', '')}
                onChange={(color) => handleResponsiveUpdate('hoverBackgroundColor', color)}
              />
            </div>
          </>
        )}

        {/* Gradient Mode Controls */}
        {backgroundMode === 'gradient' && (
          <div className="space-y-3">
            {/* Gradient Presets */}
            <div>
              <Label className="text-xs">Gradient Presets</Label>
              <Select onValueChange={(value) => {
                const preset = gradientPresets[value as keyof typeof gradientPresets];
                if (preset) {
                  handleResponsiveUpdate('backgroundImage', preset.gradient);
                  handleResponsiveUpdate('hoverBackgroundImage', preset.hoverGradient);
                }
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a gradient..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(gradientPresets).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Gradient Controls */}
            <div className="space-y-2">
              <Label className="text-xs">Custom Gradient</Label>
              
              <div>
                <Label className="text-xs">Start Color</Label>
                <ColorPicker
                  color={getCurrentValue('gradientStart', '#3b82f6')}
                  onChange={(color) => {
                    handleResponsiveUpdate('gradientStart', color);
                    const start = color;
                    const end = getCurrentValue('gradientEnd', '#8b5cf6');
                    const angle = getCurrentValue('gradientAngle', '135');
                    handleResponsiveUpdate('backgroundImage', `linear-gradient(${angle}deg, ${start}, ${end})`);
                  }}
                />
              </div>

              <div>
                <Label className="text-xs">End Color</Label>
                <ColorPicker
                  color={getCurrentValue('gradientEnd', '#8b5cf6')}
                  onChange={(color) => {
                    handleResponsiveUpdate('gradientEnd', color);
                    const start = getCurrentValue('gradientStart', '#3b82f6');
                    const end = color;
                    const angle = getCurrentValue('gradientAngle', '135');
                    handleResponsiveUpdate('backgroundImage', `linear-gradient(${angle}deg, ${start}, ${end})`);
                  }}
                />
              </div>

              <div>
                <Label className="text-xs">Angle ({getCurrentValue('gradientAngle', '135')}°)</Label>
                <Slider
                  value={[parseInt(getCurrentValue('gradientAngle', '135'))]}
                  onValueChange={(value) => {
                    handleResponsiveUpdate('gradientAngle', value[0].toString());
                    const start = getCurrentValue('gradientStart', '#3b82f6');
                    const end = getCurrentValue('gradientEnd', '#8b5cf6');
                    const angle = value[0];
                    handleResponsiveUpdate('backgroundImage', `linear-gradient(${angle}deg, ${start}, ${end})`);
                  }}
                  max={180}
                  min={0}
                  step={15}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Hover Gradient Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Enable Hover Gradient</Label>
                <Switch
                  checked={!!getCurrentValue('hoverBackgroundImage')}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      handleResponsiveUpdate('hoverBackgroundImage', '');
                    }
                  }}
                />
              </div>

              {getCurrentValue('hoverBackgroundImage') && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Hover Start Color</Label>
                    <ColorPicker
                      color={getCurrentValue('hoverGradientStart', '#2563eb')}
                      onChange={(color) => {
                        handleResponsiveUpdate('hoverGradientStart', color);
                        const start = color;
                        const end = getCurrentValue('hoverGradientEnd', '#7c3aed');
                        const angle = getCurrentValue('gradientAngle', '135');
                        handleResponsiveUpdate('hoverBackgroundImage', `linear-gradient(${angle}deg, ${start}, ${end})`);
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Hover End Color</Label>
                    <ColorPicker
                      color={getCurrentValue('hoverGradientEnd', '#7c3aed')}
                      onChange={(color) => {
                        handleResponsiveUpdate('hoverGradientEnd', color);
                        const start = getCurrentValue('hoverGradientStart', '#2563eb');
                        const end = color;
                        const angle = getCurrentValue('gradientAngle', '135');
                        handleResponsiveUpdate('hoverBackgroundImage', `linear-gradient(${angle}deg, ${start}, ${end})`);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CollapsibleGroup>

      {/* Borders & Effects */}
      <CollapsibleGroup title="Borders & Effects" isOpen={bordersOpen} onToggle={setBordersOpen}>
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
      </CollapsibleGroup>

      {/* Spacing */}
      <CollapsibleGroup title="Spacing" isOpen={spacingOpen} onToggle={setSpacingOpen}>
        <SpacingSliders
          marginTop={getCurrentValue('marginTop')}
          marginRight={getCurrentValue('marginRight')}
          marginBottom={getCurrentValue('marginBottom')}
          marginLeft={getCurrentValue('marginLeft')}
          paddingTop={getCurrentValue('paddingTop')}
          paddingRight={getCurrentValue('paddingRight')}
          paddingBottom={getCurrentValue('paddingBottom')}
          paddingLeft={getCurrentValue('paddingLeft')}
          onMarginChange={(property, value) => handleResponsiveUpdate(property, value)}
          onPaddingChange={(property, value) => handleResponsiveUpdate(property, value)}
        />
      </CollapsibleGroup>
    </div>
  );
};