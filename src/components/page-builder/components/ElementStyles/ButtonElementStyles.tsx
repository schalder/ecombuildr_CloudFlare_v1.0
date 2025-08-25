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
import { getIconByName } from '@/components/icons/icon-sources';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ButtonElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

// Professional button presets aligned with design system
const buttonPresets = {
  primary: {
    name: 'Primary',
    description: 'Main call-to-action button',
    gradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))',
    styles: {
      backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '16px',
      padding: '12px 24px',
      borderWidth: '0px',
      hoverBackgroundImage: 'linear-gradient(135deg, hsl(var(--primary)/0.9), hsl(var(--primary)/0.7))',
      boxShadow: '0 4px 14px hsl(var(--primary)/0.4)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  modern: {
    name: 'Modern',
    description: 'Sleek gradient button',
    gradient: 'linear-gradient(135deg, hsl(220 100% 60%), hsl(260 100% 65%))',
    styles: {
      backgroundImage: 'linear-gradient(135deg, hsl(220 100% 60%), hsl(260 100% 65%))',
      color: 'white',
      borderRadius: '12px',
      fontWeight: '600',
      fontSize: '16px',
      padding: '14px 28px',
      borderWidth: '0px',
      hoverBackgroundImage: 'linear-gradient(135deg, hsl(220 100% 55%), hsl(260 100% 60%))',
      boxShadow: '0 8px 25px hsl(220 100% 60% / 0.4)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  success: {
    name: 'Success',
    description: 'Success state button',
    gradient: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 45%))',
    styles: {
      backgroundImage: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 45%))',
      color: 'white',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '16px',
      padding: '12px 24px',
      borderWidth: '0px',
      hoverBackgroundImage: 'linear-gradient(135deg, hsl(142 76% 32%), hsl(142 76% 40%))',
      boxShadow: '0 4px 14px hsl(142 76% 36% / 0.4)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  premium: {
    name: 'Premium',
    description: 'Luxury gold gradient',
    gradient: 'linear-gradient(135deg, hsl(45 100% 51%), hsl(35 100% 60%))',
    styles: {
      backgroundImage: 'linear-gradient(135deg, hsl(45 100% 51%), hsl(35 100% 60%))',
      color: 'hsl(25 25% 15%)',
      borderRadius: '10px',
      fontWeight: '700',
      fontSize: '16px',
      padding: '14px 32px',
      borderWidth: '0px',
      hoverBackgroundImage: 'linear-gradient(135deg, hsl(45 100% 55%), hsl(35 100% 65%))',
      boxShadow: '0 8px 25px hsl(45 100% 51% / 0.5)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  outline: {
    name: 'Outline',
    description: 'Clean outlined button',
    gradient: 'transparent',
    styles: {
      backgroundColor: 'transparent',
      color: 'hsl(var(--foreground))',
      borderRadius: '8px',
      fontWeight: '500',
      fontSize: '16px',
      padding: '12px 24px',
      borderWidth: '2px',
      borderColor: 'hsl(var(--border))',
      hoverBackgroundColor: 'hsl(var(--accent))',
      hoverColor: 'hsl(var(--accent-foreground))',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  ghost: {
    name: 'Ghost',
    description: 'Minimal hover effect',
    gradient: 'transparent',
    styles: {
      backgroundColor: 'transparent',
      color: 'hsl(var(--foreground))',
      borderRadius: '8px',
      fontWeight: '500',
      fontSize: '16px',
      padding: '12px 24px',
      borderWidth: '0px',
      hoverBackgroundColor: 'hsl(var(--accent)/0.8)',
      hoverColor: 'hsl(var(--accent-foreground))',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  destructive: {
    name: 'Destructive',
    description: 'Warning or delete action',
    gradient: 'linear-gradient(135deg, hsl(var(--destructive)), hsl(var(--destructive)/0.8))',
    styles: {
      backgroundImage: 'linear-gradient(135deg, hsl(var(--destructive)), hsl(var(--destructive)/0.8))',
      color: 'hsl(var(--destructive-foreground))',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '16px',
      padding: '12px 24px',
      borderWidth: '0px',
      hoverBackgroundImage: 'linear-gradient(135deg, hsl(var(--destructive)/0.9), hsl(var(--destructive)/0.7))',
      boxShadow: '0 4px 14px hsl(var(--destructive)/0.4)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  neon: {
    name: 'Neon',
    description: 'Vibrant neon glow effect',
    gradient: 'linear-gradient(135deg, hsl(300 100% 60%), hsl(200 100% 60%))',
    styles: {
      backgroundImage: 'linear-gradient(135deg, hsl(300 100% 60%), hsl(200 100% 60%))',
      color: 'white',
      borderRadius: '12px',
      fontWeight: '700',
      fontSize: '16px',
      padding: '14px 28px',
      borderWidth: '0px',
      hoverBackgroundImage: 'linear-gradient(135deg, hsl(300 100% 65%), hsl(200 100% 65%))',
      boxShadow: '0 0 30px hsl(300 100% 60% / 0.6), 0 8px 25px hsl(200 100% 60% / 0.4)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Select Preset
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full z-50 bg-background border border-border shadow-lg">
              {Object.entries(buttonPresets).map(([key, preset]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="flex flex-col items-start py-3 px-4 cursor-pointer hover:bg-accent"
                >
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-muted-foreground">{preset.description}</div>
                  <div 
                    className="w-full h-6 rounded mt-2" 
                    style={{
                      background: preset.gradient,
                      border: preset.gradient === 'transparent' ? '1px solid hsl(var(--border))' : 'none'
                    }}
                  />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="text-xs text-muted-foreground">
            Presets apply professional styles to the current device view. All styles remain fully editable below.
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

      {/* Typography & Icon */}
      <CollapsibleGroup title="Typography & Icon" isOpen={typographyOpen} onToggle={setTypographyOpen}>
        <div>
          <Label className="text-xs">Button Icon (Optional)</Label>
          <div className="space-y-2">
            <Select
              value={getCurrentValue('icon', '')}
              onValueChange={(value) => handleResponsiveUpdate('icon', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background">
                <SelectItem value="">No Icon</SelectItem>
                <SelectItem value="arrow-right">Arrow Right</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="star">Star</SelectItem>
                <SelectItem value="heart">Heart</SelectItem>
                <SelectItem value="download">Download</SelectItem>
                <SelectItem value="play">Play</SelectItem>
                <SelectItem value="shopping-cart">Shopping Cart</SelectItem>
                <SelectItem value="mail">Mail</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="external-link">External Link</SelectItem>
              </SelectContent>
            </Select>
            {getCurrentValue('icon') && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Icon scales with font size automatically</span>
              </div>
            )}
          </div>
        </div>

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