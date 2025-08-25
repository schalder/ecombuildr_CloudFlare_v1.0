import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Smartphone } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilderElement } from '../../types';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';

interface ButtonElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const ButtonElementStyles: React.FC<ButtonElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  const [responsiveTab, setResponsiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [backgroundMode, setBackgroundMode] = useState<'solid' | 'gradient'>('solid');
  const [gradientStart, setGradientStart] = useState('#3b82f6');
  const [gradientEnd, setGradientEnd] = useState('#8b5cf6');
  const [gradientAngle, setGradientAngle] = useState(135);

  // Simple style getter - responsive overrides base
  const getStyle = (prop: string, fallback?: any) => {
    const responsiveStyles = element.styles?.responsive || {};
    const currentDeviceStyles = responsiveStyles[responsiveTab] || {};
    return currentDeviceStyles[prop] || element.styles?.[prop] || fallback;
  };

  // Simple style setter - uses deep merge
  const setStyle = (prop: string, value: any) => {
    if (responsiveTab === 'desktop') {
      onStyleUpdate('styles', { [prop]: value });
    } else {
      onStyleUpdate('styles', {
        responsive: {
          [responsiveTab]: { [prop]: value }
        }
      });
    }
  };

  // Detect background mode on mount
  React.useEffect(() => {
    const hasGradient = getStyle('backgroundImage', '').includes('linear-gradient');
    setBackgroundMode(hasGradient ? 'gradient' : 'solid');
    
    if (hasGradient) {
      const gradientString = getStyle('backgroundImage', '');
      // Simple gradient parsing - just get the colors if possible
      const colorMatches = gradientString.match(/#[0-9a-f]{6}|hsl\([^)]+\)/gi);
      if (colorMatches && colorMatches.length >= 2) {
        setGradientStart(colorMatches[0]);
        setGradientEnd(colorMatches[1]);
      }
    }
  }, [responsiveTab]);

  // Generate gradient
  const generateGradient = () => {
    return `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`;
  };

  // Handle background mode change
  const handleBackgroundModeChange = (mode: 'solid' | 'gradient') => {
    setBackgroundMode(mode);
    
    if (mode === 'solid') {
      // Clear gradient
      setStyle('backgroundImage', '');
      setStyle('hoverBackgroundImage', '');
    } else {
      // Set gradient and clear solid color
      const gradient = generateGradient();
      setStyle('backgroundImage', gradient);
      setStyle('backgroundColor', '');
    }
  };

  // Handle gradient updates
  React.useEffect(() => {
    if (backgroundMode === 'gradient') {
      const gradient = generateGradient();
      setStyle('backgroundImage', gradient);
    }
  }, [gradientStart, gradientEnd, gradientAngle, backgroundMode]);

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

      {/* Colors Section */}
      <CollapsibleGroup title="Colors" isOpen={true} onToggle={() => {}}>
        {/* Text Color */}
        <div>
          <Label className="text-xs">Text Color</Label>
          <ColorPicker
            color={getStyle('color', '#ffffff')}
            onChange={(color) => setStyle('color', color)}
          />
        </div>

        {/* Background Mode Toggle */}
        <div className="space-y-3">
          <Label className="text-xs">Background Mode</Label>
          <Tabs value={backgroundMode} onValueChange={handleBackgroundModeChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="solid">Solid</TabsTrigger>
              <TabsTrigger value="gradient">Gradient</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Solid Mode */}
        {backgroundMode === 'solid' && (
          <>
            <div>
              <Label className="text-xs">Background Color</Label>
              <ColorPicker
                color={getStyle('backgroundColor', 'hsl(142 76% 36%)')}
                onChange={(color) => {
                  setStyle('backgroundColor', color);
                  setStyle('backgroundImage', ''); // Clear gradient
                }}
              />
            </div>

            <div>
              <Label className="text-xs">Hover Background Color</Label>
              <ColorPicker
                color={getStyle('hoverBackgroundColor', '')}
                onChange={(color) => {
                  setStyle('hoverBackgroundColor', color);
                  setStyle('hoverBackgroundImage', ''); // Clear hover gradient
                }}
              />
            </div>
          </>
        )}

        {/* Gradient Mode */}
        {backgroundMode === 'gradient' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Start Color</Label>
              <ColorPicker
                color={gradientStart}
                onChange={setGradientStart}
              />
            </div>

            <div>
              <Label className="text-xs">End Color</Label>
              <ColorPicker
                color={gradientEnd}
                onChange={setGradientEnd}
              />
            </div>

            <div>
              <Label className="text-xs">Angle ({gradientAngle}°)</Label>
              <Slider
                value={[gradientAngle]}
                onValueChange={(value) => setGradientAngle(value[0])}
                max={360}
                min={0}
                step={1}
              />
            </div>
          </div>
        )}

        {/* Hover Text Color */}
        <div>
          <Label className="text-xs">Hover Text Color</Label>
          <ColorPicker
            color={getStyle('hoverColor', '')}
            onChange={(color) => setStyle('hoverColor', color)}
          />
        </div>
      </CollapsibleGroup>

      {/* Typography */}
      <CollapsibleGroup title="Typography" isOpen={false} onToggle={() => {}}>
        <div>
          <Label className="text-xs">Font Size</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(getStyle('fontSize', '16px').replace(/\D/g, ''))]}
              onValueChange={(value) => setStyle('fontSize', `${value[0]}px`)}
              max={100}
              min={8}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {getStyle('fontSize', '16px')}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Font Weight</Label>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant={getStyle('fontWeight') === 'normal' ? 'default' : 'outline'}
              onClick={() => setStyle('fontWeight', 'normal')}
            >
              Normal
            </Button>
            <Button
              size="sm"
              variant={getStyle('fontWeight') === 'bold' ? 'default' : 'outline'}
              onClick={() => setStyle('fontWeight', 'bold')}
            >
              Bold
            </Button>
          </div>
        </div>
      </CollapsibleGroup>

      {/* Width */}
      <CollapsibleGroup title="Dimensions" isOpen={false} onToggle={() => {}}>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Full Width</Label>
          <Switch
            checked={getStyle('width') === '100%'}
            onCheckedChange={(checked) => setStyle('width', checked ? '100%' : 'auto')}
          />
        </div>
      </CollapsibleGroup>

      {/* Spacing */}
      <CollapsibleGroup title="Spacing" isOpen={false} onToggle={() => {}}>
        <SpacingSliders
          marginTop={getStyle('marginTop')}
          marginRight={getStyle('marginRight')}
          marginBottom={getStyle('marginBottom')}
          marginLeft={getStyle('marginLeft')}
          paddingTop={getStyle('paddingTop')}
          paddingRight={getStyle('paddingRight')}
          paddingBottom={getStyle('paddingBottom')}
          paddingLeft={getStyle('paddingLeft')}
          onMarginChange={(property, value) => setStyle(property, value)}
          onPaddingChange={(property, value) => setStyle(property, value)}
        />
      </CollapsibleGroup>
    </div>
  );
};