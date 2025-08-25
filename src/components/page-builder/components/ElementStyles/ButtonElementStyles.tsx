import React, { useState, useEffect } from 'react';
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
  const [dimensionsOpen, setDimensionsOpen] = useState(false);
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(true);
  const [bordersOpen, setBordersOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState<'solid' | 'gradient'>('solid');
  
  // Custom gradient state
  const [gradientStart, setGradientStart] = useState('#3b82f6');
  const [gradientEnd, setGradientEnd] = useState('#8b5cf6');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [enableHoverGradient, setEnableHoverGradient] = useState(false);
  const [hoverGradientStart, setHoverGradientStart] = useState('#2563eb');
  const [hoverGradientEnd, setHoverGradientEnd] = useState('#7c3aed');
  const [hoverGradientAngle, setHoverGradientAngle] = useState(135);

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

  // Helper function to parse linear-gradient strings correctly
  const parseLinearGradient = (gradientString: string) => {
    if (!gradientString || !gradientString.includes('linear-gradient')) {
      return null;
    }

    // Extract the content inside linear-gradient()
    const match = gradientString.match(/linear-gradient\(([^)]+)\)/);
    if (!match) return null;

    const content = match[1];
    
    // Split by commas, but be careful about commas inside color functions
    const parts = [];
    let current = '';
    let depth = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '(') depth++;
      if (char === ')') depth--;
      
      if (char === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) parts.push(current.trim());

    if (parts.length < 3) return null;

    // First part should be the angle
    const angleMatch = parts[0].match(/(\d+)deg/);
    const angle = angleMatch ? parseInt(angleMatch[1]) : 135;

    // Remaining parts are colors
    const startColor = parts[1].trim();
    const endColor = parts[2].trim();

    return { angle, startColor, endColor };
  };

  // Auto-detect background mode based on existing styles
  useEffect(() => {
    const hasGradient = getCurrentValue('backgroundImage', '').includes('linear-gradient');
    setBackgroundMode(hasGradient ? 'gradient' : 'solid');
    
    // Parse existing gradient if present
    if (hasGradient) {
      const backgroundImage = getCurrentValue('backgroundImage', '');
      const parsed = parseLinearGradient(backgroundImage);
      if (parsed) {
        setGradientAngle(parsed.angle);
        setGradientStart(parsed.startColor);
        setGradientEnd(parsed.endColor);
      }
      
      // Parse hover gradient if present
      const hoverBackgroundImage = getCurrentValue('hoverBackgroundImage', '');
      if (hoverBackgroundImage.includes('linear-gradient')) {
        setEnableHoverGradient(true);
        const hoverParsed = parseLinearGradient(hoverBackgroundImage);
        if (hoverParsed) {
          setHoverGradientAngle(hoverParsed.angle);
          setHoverGradientStart(hoverParsed.startColor);
          setHoverGradientEnd(hoverParsed.endColor);
        }
      }
    }
  }, [responsiveTab, element.styles]);

  // Generate gradient CSS
  const generateGradient = (start: string, end: string, angle: number) => {
    return `linear-gradient(${angle}deg, ${start}, ${end})`;
  };

  // Update gradient when values change
  const updateGradient = () => {
    if (backgroundMode === 'gradient') {
      const gradient = generateGradient(gradientStart, gradientEnd, gradientAngle);
      handleResponsiveUpdate('backgroundImage', gradient);
      
      if (enableHoverGradient) {
        const hoverGradient = generateGradient(hoverGradientStart, hoverGradientEnd, hoverGradientAngle);
        handleResponsiveUpdate('hoverBackgroundImage', hoverGradient);
      } else {
        handleResponsiveUpdate('hoverBackgroundImage', '');
      }
    }
  };

  // Update gradient when any gradient value changes
  useEffect(() => {
    if (backgroundMode === 'gradient') {
      updateGradient();
    }
  }, [gradientStart, gradientEnd, gradientAngle, enableHoverGradient, hoverGradientStart, hoverGradientEnd, hoverGradientAngle, backgroundMode]);

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
            } else {
              // Initialize gradient when switching to gradient mode
              const gradient = generateGradient(gradientStart, gradientEnd, gradientAngle);
              handleResponsiveUpdate('backgroundImage', gradient);
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
                color={getCurrentValue('backgroundColor', 'hsl(142 76% 36%)')}
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
            {/* Custom Gradient Controls */}
            <div className="space-y-2">
              <Label className="text-xs">Gradient Colors</Label>
              
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
                  className="flex-1"
                />
              </div>
            </div>

            {/* Hover Gradient Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Hover Gradient</Label>
                <Switch
                  checked={enableHoverGradient}
                  onCheckedChange={setEnableHoverGradient}
                />
              </div>

              {enableHoverGradient && (
                <>
                  <div>
                    <Label className="text-xs">Hover Start Color</Label>
                    <ColorPicker
                      color={hoverGradientStart}
                      onChange={setHoverGradientStart}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Hover End Color</Label>
                    <ColorPicker
                      color={hoverGradientEnd}
                      onChange={setHoverGradientEnd}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Hover Angle ({hoverGradientAngle}°)</Label>
                    <Slider
                      value={[hoverGradientAngle]}
                      onValueChange={(value) => setHoverGradientAngle(value[0])}
                      max={360}
                      min={0}
                      step={1}
                      className="flex-1"
                    />
                  </div>
                </>
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