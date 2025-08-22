import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Monitor, Smartphone, ChevronDown } from 'lucide-react';
import { PageBuilderElement } from '../../types';

interface HeroSliderElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const HeroSliderElementStyles: React.FC<HeroSliderElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  // Responsive controls (desktop/mobile)
  const [responsiveTab, setResponsiveTab] = React.useState<'desktop' | 'mobile'>('desktop');
  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentStyles = (responsiveStyles as any)[responsiveTab] || {};
  
  // Collapsible state
  const [openSections, setOpenSections] = React.useState({
    dimensions: true,
    background: false,
    typography: false,
    button: false,
    border: false,
    effects: false,
    spacing: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const handleResponsiveUpdate = (property: string, value: any) => {
    const updatedResponsive = {
      ...responsiveStyles,
      [responsiveTab]: {
        ...currentStyles,
        [property]: value,
      },
    };
    onStyleUpdate('responsive', updatedResponsive);
  };

  // Box shadow presets
  const boxShadowPresets = [
    { name: 'None', value: 'none' },
    { name: 'Small', value: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)' },
    { name: 'Medium', value: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)' },
    { name: 'Large', value: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)' },
    { name: 'Extra Large', value: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)' },
  ];

  return (
    <div className="space-y-2">
      {/* Device toggle for responsive settings */}
      <div className="flex items-center justify-between mb-4">
        <Label className="text-xs">Device</Label>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant={responsiveTab === 'desktop' ? 'default' : 'outline'} 
            onClick={() => setResponsiveTab('desktop')}
          >
            <Monitor className="h-4 w-4 mr-1" /> Desktop
          </Button>
          <Button 
            size="sm" 
            variant={responsiveTab === 'mobile' ? 'default' : 'outline'} 
            onClick={() => setResponsiveTab('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-1" /> Mobile
          </Button>
        </div>
      </div>

      {/* Dimensions */}
      <Collapsible open={openSections.dimensions} onOpenChange={() => toggleSection('dimensions')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-accent">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dimensions</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.dimensions ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 p-2">
          <div>
            <Label className="text-xs">Height</Label>
            <Input
              value={(currentStyles.minHeight || element.styles?.minHeight || '') as string}
              onChange={(e) => handleResponsiveUpdate('minHeight', e.target.value)}
              placeholder="e.g., 500px, 60vh, 100vh"
            />
          </div>

          <div>
            <Label className="text-xs">Max Width</Label>
            <Input
              value={(currentStyles.maxWidth || element.styles?.maxWidth || '') as string}
              onChange={(e) => handleResponsiveUpdate('maxWidth', e.target.value)}
              placeholder="100%"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Background */}
      <Collapsible open={openSections.background} onOpenChange={() => toggleSection('background')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-accent">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Background</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.background ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 p-2">
          <ColorPicker
            label="Background Color"
            color={(currentStyles.backgroundColor || element.styles?.backgroundColor || '') as string}
            onChange={(color) => handleResponsiveUpdate('backgroundColor', color)}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Typography */}
      <Collapsible open={openSections.typography} onOpenChange={() => toggleSection('typography')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-accent">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Typography</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.typography ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-2">
          {/* Sub Headline */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Sub Headline</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size</Label>
                <Input
                  value={(currentStyles?.subHeadlineFontSize || (element.styles as any)?.subHeadlineFontSize || '') as string}
                  onChange={(e) => handleResponsiveUpdate('subHeadlineFontSize', e.target.value)}
                  placeholder="14px"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <ColorPicker
                  color={(currentStyles?.subHeadlineColor || (element.styles as any)?.subHeadlineColor || '') as string}
                  onChange={(color) => handleResponsiveUpdate('subHeadlineColor', color)}
                />
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Headline</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size</Label>
                <Input
                  value={(currentStyles?.headlineFontSize || (element.styles as any)?.headlineFontSize || '') as string}
                  onChange={(e) => handleResponsiveUpdate('headlineFontSize', e.target.value)}
                  placeholder="48px"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <ColorPicker
                  color={(currentStyles?.headlineColor || (element.styles as any)?.headlineColor || '') as string}
                  onChange={(color) => handleResponsiveUpdate('headlineColor', color)}
                />
              </div>
            </div>
          </div>

          {/* Paragraph */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Paragraph</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size</Label>
                <Input
                  value={(currentStyles?.paragraphFontSize || (element.styles as any)?.paragraphFontSize || '') as string}
                  onChange={(e) => handleResponsiveUpdate('paragraphFontSize', e.target.value)}
                  placeholder="18px"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <ColorPicker
                  color={(currentStyles?.paragraphColor || (element.styles as any)?.paragraphColor || '') as string}
                  onChange={(color) => handleResponsiveUpdate('paragraphColor', color)}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Button */}
      <Collapsible open={openSections.button} onOpenChange={() => toggleSection('button')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-accent">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Button</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.button ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 p-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Button Size</Label>
              <Select
                value={(currentStyles?.buttonSize || (element.styles as any)?.buttonSize || 'lg') as string}
                onValueChange={(value) => handleResponsiveUpdate('buttonSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Font Size</Label>
              <Input
                value={(currentStyles?.buttonFontSize || (element.styles as any)?.buttonFontSize || '') as string}
                onChange={(e) => handleResponsiveUpdate('buttonFontSize', e.target.value)}
                placeholder="16px"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Background Color</Label>
              <ColorPicker
                color={(currentStyles?.buttonBackgroundColor || (element.styles as any)?.buttonBackgroundColor || '') as string}
                onChange={(color) => handleResponsiveUpdate('buttonBackgroundColor', color)}
              />
            </div>
            <div>
              <Label className="text-xs">Text Color</Label>
              <ColorPicker
                color={(currentStyles?.buttonTextColor || (element.styles as any)?.buttonTextColor || '') as string}
                onChange={(color) => handleResponsiveUpdate('buttonTextColor', color)}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Border */}
      <Collapsible open={openSections.border} onOpenChange={() => toggleSection('border')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-accent">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Border</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.border ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 p-2">
          <div>
            <Label className="text-xs">Border Width</Label>
            <Input
              value={(currentStyles.borderWidth || element.styles?.borderWidth || '') as string}
              onChange={(e) => handleResponsiveUpdate('borderWidth', e.target.value)}
              placeholder="e.g., 1px"
            />
          </div>

          <ColorPicker
            label="Border Color"
            color={(currentStyles.borderColor || element.styles?.borderColor || '') as string}
            onChange={(color) => handleResponsiveUpdate('borderColor', color)}
          />

          <div>
            <Label className="text-xs">Border Radius</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt((currentStyles.borderRadius || element.styles?.borderRadius || '0').toString().replace('px', ''))]}
                onValueChange={(value) => handleResponsiveUpdate('borderRadius', `${value[0]}px`)}
                max={50}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {(currentStyles.borderRadius || element.styles?.borderRadius || '0px')}
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Effects */}
      <Collapsible open={openSections.effects} onOpenChange={() => toggleSection('effects')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-accent">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Effects</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.effects ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 p-2">
          <div>
            <Label className="text-xs">Opacity</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseFloat((currentStyles.opacity || element.styles?.opacity || '1').toString())]}
                onValueChange={(value) => handleResponsiveUpdate('opacity', value[0].toString())}
                max={1}
                min={0}
                step={0.1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {(currentStyles.opacity || element.styles?.opacity || '1')}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Box Shadow</Label>
            <Select
              value={(currentStyles.boxShadow || element.styles?.boxShadow || 'none') as string}
              onValueChange={(value) => handleResponsiveUpdate('boxShadow', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shadow" />
              </SelectTrigger>
              <SelectContent>
                {boxShadowPresets.map((preset) => (
                  <SelectItem key={preset.name} value={preset.value}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Transform</Label>
            <Input
              value={(currentStyles?.transform || (element.styles as any)?.transform || '') as string}
              onChange={(e) => handleResponsiveUpdate('transform', e.target.value)}
              placeholder="e.g., scale(1.05), rotate(5deg)"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Spacing */}
      <Collapsible open={openSections.spacing} onOpenChange={() => toggleSection('spacing')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-accent">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.spacing ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-2">
          {/* Margin */}
          <div className="space-y-2">
            <Label className="text-xs">Margin</Label>
            <div className="grid grid-cols-4 gap-2">
              {['Top', 'Right', 'Bottom', 'Left'].map((side) => {
                const property = `margin${side}`;
                const value = parseInt((currentStyles[property] || element.styles?.[property] || '0').toString().replace(/[^0-9]/g, '') || '0');
                return (
                  <div key={side}>
                    <Label className="text-xs text-muted-foreground">{side}</Label>
                    <div className="space-y-1">
                      <Slider
                        value={[value]}
                        onValueChange={(values) => handleResponsiveUpdate(property, `${values[0]}px`)}
                        max={100}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{value}px</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Padding */}
          <div className="space-y-2">
            <Label className="text-xs">Padding</Label>
            <div className="grid grid-cols-4 gap-2">
              {['Top', 'Right', 'Bottom', 'Left'].map((side) => {
                const property = `padding${side}`;
                const value = parseInt((currentStyles[property] || element.styles?.[property] || '20').toString().replace(/[^0-9]/g, '') || '20');
                return (
                  <div key={side}>
                    <Label className="text-xs text-muted-foreground">{side}</Label>
                    <div className="space-y-1">
                      <Slider
                        value={[value]}
                        onValueChange={(values) => handleResponsiveUpdate(property, `${values[0]}px`)}
                        max={100}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{value}px</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};