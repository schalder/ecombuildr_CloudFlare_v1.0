import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Tablet, Smartphone, Search, X, Type } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilderElement } from '../../types';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';
import { ResponsiveSpacingSliders } from './_shared/ResponsiveSpacingSliders';
import { IconPicker } from '@/components/ui/icon-picker';
import { ResponsiveStyleControl, ResponsiveTabs } from './_shared/ResponsiveStyleControl';
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';

interface ButtonElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
  onContentUpdate: (property: string, value: any) => void;
}


export const ButtonElementStyles: React.FC<ButtonElementStylesProps> = ({
  element,
  onStyleUpdate,
  onContentUpdate
}) => {
  const [responsiveTab, setResponsiveTab] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [dimensionsOpen, setDimensionsOpen] = useState(false);
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [bordersOpen, setBordersOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
  const [iconStylingOpen, setIconStylingOpen] = useState(false);
  const [subtextStylingOpen, setSubtextStylingOpen] = useState(false);

  // Handle icon changes
  const handleIconChange = (iconName: string | null) => {
    onContentUpdate('icon', iconName);
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

  const fontOptions = React.useMemo(() => {
    const base = [
      { label: 'Default', value: 'default' },
      { label: 'System Sans', value: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"' },
      { label: 'Serif', value: 'Georgia, Times New Roman, Times, serif' },
      { label: 'Monospace', value: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
    ];
    const google = [
      { label: 'Poppins', value: '"Poppins", sans-serif', family: 'Poppins', weights: '400;500;600;700' },
      { label: 'Montserrat', value: '"Montserrat", sans-serif', family: 'Montserrat', weights: '400;500;600;700' },
      { label: 'Roboto', value: 'Roboto, sans-serif', family: 'Roboto', weights: '400;500;700' },
      { label: 'Open Sans', value: '"Open Sans", sans-serif', family: 'Open Sans', weights: '400;600;700' },
      { label: 'Lato', value: 'Lato, sans-serif', family: 'Lato', weights: '400;700' },
      { label: 'Playfair Display', value: '"Playfair Display", serif', family: 'Playfair Display', weights: '400;700' },
      { label: 'Hind Siliguri', value: '"Hind Siliguri", sans-serif', family: 'Hind Siliguri', weights: '300;400;500;600;700' },
      { label: 'Noto Sans Bengali', value: '"Noto Sans Bengali", sans-serif', family: 'Noto Sans Bengali', weights: '400;500;600;700' },
    ];
    return [...base, ...google];
  }, []);

  return (
    <div className="space-y-4">
      {/* Device Toggle */}
      <ResponsiveTabs activeTab={responsiveTab} onTabChange={setResponsiveTab} />

      {/* Button Icon */}
      <CollapsibleGroup title="Button Icon" isOpen={iconOpen} onToggle={setIconOpen}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Icon</Label>
            {element.content.icon && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleIconChange(null)}
                className="h-6 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <IconPicker
            value={element.content.icon || ''}
            onChange={(value) => onContentUpdate('icon', value)}
          />
          
          <p className="text-xs text-muted-foreground">
            Icon will automatically scale with font size and match text color.
          </p>
        </div>
      </CollapsibleGroup>

      {/* Icon Styling - Only show if icon exists */}
      {element.content.icon && (
        <CollapsibleGroup title="Icon Styling" isOpen={iconStylingOpen} onToggle={setIconStylingOpen}>
          <div className="space-y-3">
            {/* Icon Size */}
            <ResponsiveStyleControl
              element={element}
              property="iconSize"
              label="Icon Size"
              deviceType={responsiveTab}
              fallback="16px"
              onStyleUpdate={onStyleUpdate}
            >
              {(value, onChange) => (
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[parseInt(value.toString().replace(/\D/g, ''))]}
                    onValueChange={(val) => onChange(`${val[0]}px`)}
                    max={100}
                    min={8}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {value}
                  </span>
                </div>
              )}
            </ResponsiveStyleControl>

            {/* Icon Color */}
            <ResponsiveStyleControl
              element={element}
              property="iconColor"
              label="Icon Color"
              deviceType={responsiveTab}
              fallback="currentColor"
              onStyleUpdate={onStyleUpdate}
            >
              {(value, onChange) => (
                <ColorPicker
                  color={value}
                  onChange={onChange}
                />
              )}
            </ResponsiveStyleControl>

            {/* Icon Position */}
            <div>
              <Label className="text-xs">Icon Position</Label>
              <div className="flex space-x-1 mt-1">
                <Button
                  size="sm"
                  variant={element.content.iconPosition === 'before' ? 'default' : 'outline'}
                  onClick={() => onContentUpdate('iconPosition', 'before')}
                >
                  Before Text
                </Button>
                <Button
                  size="sm"
                  variant={element.content.iconPosition === 'after' ? 'default' : 'outline'}
                  onClick={() => onContentUpdate('iconPosition', 'after')}
                >
                  After Text
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleGroup>
      )}

      {/* Dimensions */}
      <CollapsibleGroup title="Dimensions" isOpen={dimensionsOpen} onToggle={setDimensionsOpen}>
        <ResponsiveStyleControl
          element={element}
          property="width"
          label="Full Width"
          deviceType={responsiveTab}
          fallback="auto"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Switch
              checked={value === '100%'}
              onCheckedChange={(checked) => onChange(checked ? '100%' : 'auto')}
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="minWidth"
          label="Min Width"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., 120px, 20%"
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="maxWidth"
          label="Max Width"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., 300px, 80%"
            />
          )}
        </ResponsiveStyleControl>
      </CollapsibleGroup>

      {/* Typography */}
      <CollapsibleGroup title="Typography" isOpen={typographyOpen} onToggle={setTypographyOpen}>
        <ResponsiveStyleControl
          element={element}
          property="fontFamily"
          label="Font Family"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Select value={fontOptions.find(f => f.value === value)?.value || 'default'} onValueChange={(v) => {
              const meta = fontOptions.find(f => f.value === v);
              if (meta && (meta as any).family) ensureGoogleFontLoaded((meta as any).family, (meta as any).weights);
              onChange(v === 'default' ? '' : v);
            }}>
              <SelectTrigger className="h-8 bg-background">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((f: any) => (
                  <SelectItem key={f.label} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="fontSize"
          label="Font Size"
          deviceType={responsiveTab}
          fallback="16px"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(value.toString().replace(/\D/g, ''))]}
                onValueChange={(val) => onChange(`${val[0]}px`)}
                max={100}
                min={8}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {value}
              </span>
            </div>
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="fontWeight"
          label="Font Weight"
          deviceType={responsiveTab}
          fallback="normal"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant={value === 'normal' ? 'default' : 'outline'}
                onClick={() => onChange('normal')}
              >
                Normal
              </Button>
              <Button
                size="sm"
                variant={value === 'bold' ? 'default' : 'outline'}
                onClick={() => onChange('bold')}
              >
                Bold
              </Button>
            </div>
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="textAlign"
          label="Text Align"
          deviceType={responsiveTab}
          fallback="left"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant={value === 'left' ? 'default' : 'outline'}
                onClick={() => onChange('left')}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={value === 'center' ? 'default' : 'outline'}
                onClick={() => onChange('center')}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={value === 'right' ? 'default' : 'outline'}
                onClick={() => onChange('right')}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </ResponsiveStyleControl>
      </CollapsibleGroup>

      {/* Colors */}
      <CollapsibleGroup title="Colors" isOpen={colorsOpen} onToggle={setColorsOpen}>
        <ResponsiveStyleControl
          element={element}
          property="color"
          label="Text Color"
          deviceType={responsiveTab}
          fallback="#ffffff"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker
              color={value}
              onChange={onChange}
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="backgroundColor"
          label="Background Color"
          deviceType={responsiveTab}
          fallback="#3b82f6"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker
              color={value}
              onChange={onChange}
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="hoverColor"
          label="Text Hover Color"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker
              color={value}
              onChange={onChange}
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="hoverBackgroundColor"
          label="Background Hover Color"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker
              color={value}
              onChange={onChange}
            />
          )}
        </ResponsiveStyleControl>
      </CollapsibleGroup>

      {/* Borders & Effects */}
      <CollapsibleGroup title="Borders & Effects" isOpen={bordersOpen} onToggle={setBordersOpen}>
        <ResponsiveStyleControl
          element={element}
          property="borderWidth"
          label="Border Width"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., 1px"
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="borderColor"
          label="Border Color"
          deviceType={responsiveTab}
          fallback="#e5e7eb"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker
              color={value}
              onChange={onChange}
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="borderRadius"
          label="Border Radius"
          deviceType={responsiveTab}
          fallback="6px"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(value.toString().replace(/\D/g, ''))]}
                onValueChange={(val) => onChange(`${val[0]}px`)}
                max={50}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {value}
              </span>
            </div>
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="boxShadow"
          label="Box Shadow"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., 0 2px 4px rgba(0,0,0,0.1)"
            />
          )}
        </ResponsiveStyleControl>
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

      {/* Subtext Styling - only show if subtext exists */}
      {element.content.subtext && (
        <CollapsibleGroup
          title="Subtext Styling"
          isOpen={subtextStylingOpen}
          onToggle={setSubtextStylingOpen}
        >
          <div className="space-y-4">
            {/* Font Size */}
            <ResponsiveStyleControl
              element={element}
              property="subtextFontSize"
              label="Font Size"
              deviceType={responsiveTab}
              fallback="12px"
              onStyleUpdate={onStyleUpdate}
            >
              {(value, onChange) => (
                <div className="space-y-2">
                  <Slider
                    value={[parseInt(value.toString().replace(/\D/g, ''))]}
                    onValueChange={(val) => onChange(`${val[0]}px`)}
                    max={24}
                    min={8}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="8"
                      max="24"
                      value={parseInt(value.toString().replace(/\D/g, ''))}
                      onChange={(e) => onChange(`${e.target.value}px`)}
                      className="w-20 h-8 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                </div>
              )}
            </ResponsiveStyleControl>

            {/* Color */}
            <ResponsiveStyleControl
              element={element}
              property="subtextColor"
              label="Color"
              deviceType={responsiveTab}
              fallback="#ffffff"
              onStyleUpdate={onStyleUpdate}
            >
              {(value, onChange) => (
                <ColorPicker
                  color={value}
                  onChange={onChange}
                />
              )}
            </ResponsiveStyleControl>

            {/* Font Weight */}
            <ResponsiveStyleControl
              element={element}
              property="subtextFontWeight"
              label="Font Weight"
              deviceType={responsiveTab}
              fallback="400"
              onStyleUpdate={onStyleUpdate}
            >
              {(value, onChange) => (
                <Select
                  value={value}
                  onValueChange={onChange}
                >
                  <SelectTrigger>
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
              )}
            </ResponsiveStyleControl>

            {/* Font Family */}
            <ResponsiveStyleControl
              element={element}
              property="subtextFontFamily"
              label="Font Family"
              deviceType={responsiveTab}
              fallback="inherit"
              onStyleUpdate={onStyleUpdate}
            >
              {(value, onChange) => (
                <Select
                  value={value}
                  onValueChange={(value) => {
                    onChange(value);
                    if (value !== 'inherit') {
                      ensureGoogleFontLoaded(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">Inherit</SelectItem>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Lato">Lato</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                    <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                    <SelectItem value="Nunito">Nunito</SelectItem>
                    <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                    <SelectItem value="Merriweather">Merriweather</SelectItem>
                    <SelectItem value="Oswald">Oswald</SelectItem>
                    <SelectItem value="Raleway">Raleway</SelectItem>
                    <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                    <SelectItem value="Lora">Lora</SelectItem>
                    <SelectItem value="PT Sans">PT Sans</SelectItem>
                    <SelectItem value="Droid Sans">Droid Sans</SelectItem>
                    <SelectItem value="Fira Sans">Fira Sans</SelectItem>
                    <SelectItem value="Crimson Text">Crimson Text</SelectItem>
                    <SelectItem value="Libre Baskerville">Libre Baskerville</SelectItem>
                    <SelectItem value="Abril Fatface">Abril Fatface</SelectItem>
                    <SelectItem value="Pacifico">Pacifico</SelectItem>
                    <SelectItem value="Righteous">Righteous</SelectItem>
                    <SelectItem value="Orbitron">Orbitron</SelectItem>
                    <SelectItem value="Monoton">Monoton</SelectItem>
                    <SelectItem value="Creepster">Creepster</SelectItem>
                    <SelectItem value="Butcherman">Butcherman</SelectItem>
                    <SelectItem value="Nosifer">Nosifer</SelectItem>
                    <SelectItem value="Griffy">Griffy</SelectItem>
                    <SelectItem value="Fascinate Inline">Fascinate Inline</SelectItem>
                    <SelectItem value="Fascinate">Fascinate</SelectItem>
                    <SelectItem value="Metamorphous">Metamorphous</SelectItem>
                    <SelectItem value="Text Me One">Text Me One</SelectItem>
                    <SelectItem value="Emblema One">Emblema One</SelectItem>
                    <SelectItem value="Emilys Candy">Emilys Candy</SelectItem>
                    <SelectItem value="Bigelow Rules">Bigelow Rules</SelectItem>
                    <SelectItem value="Bilbo Swash Caps">Bilbo Swash Caps</SelectItem>
                    <SelectItem value="Frijole">Frijole</SelectItem>
                    <SelectItem value="Germania One">Germania One</SelectItem>
                    <SelectItem value="Give You Glory">Give You Glory</SelectItem>
                    <SelectItem value="Glass Antiqua">Glass Antiqua</SelectItem>
                    <SelectItem value="Goblin One">Goblin One</SelectItem>
                    <SelectItem value="Gravitas One">Gravitas One</SelectItem>
                    <SelectItem value="Henny Penny">Henny Penny</SelectItem>
                    <SelectItem value="Herr Von Muellerhoff">Herr Von Muellerhoff</SelectItem>
                    <SelectItem value="Homemade Apple">Homemade Apple</SelectItem>
                    <SelectItem value="Irish Grover">Irish Grover</SelectItem>
                    <SelectItem value="Kranky">Kranky</SelectItem>
                    <SelectItem value="Lily Script One">Lily Script One</SelectItem>
                    <SelectItem value="Lobster">Lobster</SelectItem>
                    <SelectItem value="Macondo">Macondo</SelectItem>
                    <SelectItem value="Macondo Swash Caps">Macondo Swash Caps</SelectItem>
                    <SelectItem value="MedievalSharp">MedievalSharp</SelectItem>
                    <SelectItem value="Megrim">Megrim</SelectItem>
                    <SelectItem value="Merienda">Merienda</SelectItem>
                    <SelectItem value="Merienda One">Merienda One</SelectItem>
                    <SelectItem value="Mervale Script">Mervale Script</SelectItem>
                    <SelectItem value="Metamorphous">Metamorphous</SelectItem>
                    <SelectItem value="Miltonian">Miltonian</SelectItem>
                    <SelectItem value="Miltonian Tattoo">Miltonian Tattoo</SelectItem>
                    <SelectItem value="Miniver">Miniver</SelectItem>
                    <SelectItem value="Miss Fajardose">Miss Fajardose</SelectItem>
                    <SelectItem value="Modern Antiqua">Modern Antiqua</SelectItem>
                    <SelectItem value="Molengo">Molengo</SelectItem>
                    <SelectItem value="Monofett">Monofett</SelectItem>
                    <SelectItem value="Monoton">Monoton</SelectItem>
                    <SelectItem value="Monsieur La Doulaise">Monsieur La Doulaise</SelectItem>
                    <SelectItem value="Montaga">Montaga</SelectItem>
                    <SelectItem value="Montez">Montez</SelectItem>
                    <SelectItem value="Mountains of Christmas">Mountains of Christmas</SelectItem>
                    <SelectItem value="Mouse Memoirs">Mouse Memoirs</SelectItem>
                    <SelectItem value="Mr Bedfort">Mr Bedfort</SelectItem>
                    <SelectItem value="Mr Dafoe">Mr Dafoe</SelectItem>
                    <SelectItem value="Mr De Haviland">Mr De Haviland</SelectItem>
                    <SelectItem value="Mrs Saint Delafield">Mrs Saint Delafield</SelectItem>
                    <SelectItem value="Mrs Sheppards">Mrs Sheppards</SelectItem>
                    <SelectItem value="Mystery Quest">Mystery Quest</SelectItem>
                    <SelectItem value="Neucha">Neucha</SelectItem>
                    <SelectItem value="Neuton">Neuton</SelectItem>
                    <SelectItem value="New Rocker">New Rocker</SelectItem>
                    <SelectItem value="News Cycle">News Cycle</SelectItem>
                    <SelectItem value="Niconne">Niconne</SelectItem>
                    <SelectItem value="Nixie One">Nixie One</SelectItem>
                    <SelectItem value="Nobile">Nobile</SelectItem>
                    <SelectItem value="Nokora">Nokora</SelectItem>
                    <SelectItem value="Norican">Norican</SelectItem>
                    <SelectItem value="Nosifer">Nosifer</SelectItem>
                    <SelectItem value="Nothing You Could Do">Nothing You Could Do</SelectItem>
                    <SelectItem value="Noticia Text">Noticia Text</SelectItem>
                    <SelectItem value="Noto Sans">Noto Sans</SelectItem>
                    <SelectItem value="Noto Serif">Noto Serif</SelectItem>
                    <SelectItem value="Nova Cut">Nova Cut</SelectItem>
                    <SelectItem value="Nova Flat">Nova Flat</SelectItem>
                    <SelectItem value="Nova Mono">Nova Mono</SelectItem>
                    <SelectItem value="Nova Oval">Nova Oval</SelectItem>
                    <SelectItem value="Nova Round">Nova Round</SelectItem>
                    <SelectItem value="Nova Script">Nova Script</SelectItem>
                    <SelectItem value="Nova Slim">Nova Slim</SelectItem>
                    <SelectItem value="Nova Square">Nova Square</SelectItem>
                    <SelectItem value="Numans">Numans</SelectItem>
                    <SelectItem value="Nunito">Nunito</SelectItem>
                    <SelectItem value="Odor Mean Chey">Odor Mean Chey</SelectItem>
                    <SelectItem value="Offside">Offside</SelectItem>
                    <SelectItem value="Old Standard TT">Old Standard TT</SelectItem>
                    <SelectItem value="Oldenburg">Oldenburg</SelectItem>
                    <SelectItem value="Oleo Script">Oleo Script</SelectItem>
                    <SelectItem value="Oleo Script Swash Caps">Oleo Script Swash Caps</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Open Sans Condensed">Open Sans Condensed</SelectItem>
                    <SelectItem value="Oranienbaum">Oranienbaum</SelectItem>
                    <SelectItem value="Orbitron">Orbitron</SelectItem>
                    <SelectItem value="Oregano">Oregano</SelectItem>
                    <SelectItem value="Orienta">Orienta</SelectItem>
                    <SelectItem value="Original Surfer">Original Surfer</SelectItem>
                    <SelectItem value="Oswald">Oswald</SelectItem>
                    <SelectItem value="Over the Rainbow">Over the Rainbow</SelectItem>
                    <SelectItem value="Overlock">Overlock</SelectItem>
                    <SelectItem value="Overlock SC">Overlock SC</SelectItem>
                    <SelectItem value="Ovo">Ovo</SelectItem>
                    <SelectItem value="Oxygen">Oxygen</SelectItem>
                    <SelectItem value="Oxygen Mono">Oxygen Mono</SelectItem>
                    <SelectItem value="PT Mono">PT Mono</SelectItem>
                    <SelectItem value="PT Sans">PT Sans</SelectItem>
                    <SelectItem value="PT Sans Caption">PT Sans Caption</SelectItem>
                    <SelectItem value="PT Sans Narrow">PT Sans Narrow</SelectItem>
                    <SelectItem value="PT Serif">PT Serif</SelectItem>
                    <SelectItem value="PT Serif Caption">PT Serif Caption</SelectItem>
                    <SelectItem value="Pacifico">Pacifico</SelectItem>
                    <SelectItem value="Palanquin">Palanquin</SelectItem>
                    <SelectItem value="Palanquin Dark">Palanquin Dark</SelectItem>
                    <SelectItem value="Paprika">Paprika</SelectItem>
                    <SelectItem value="Parisienne">Parisienne</SelectItem>
                    <SelectItem value="Passero One">Passero One</SelectItem>
                    <SelectItem value="Passion One">Passion One</SelectItem>
                    <SelectItem value="Pathway Gothic One">Pathway Gothic One</SelectItem>
                    <SelectItem value="Patrick Hand">Patrick Hand</SelectItem>
                    <SelectItem value="Patrick Hand SC">Patrick Hand SC</SelectItem>
                    <SelectItem value="Patua One">Patua One</SelectItem>
                    <SelectItem value="Paytone One">Paytone One</SelectItem>
                    <SelectItem value="Peralta">Peralta</SelectItem>
                    <SelectItem value="Permanent Marker">Permanent Marker</SelectItem>
                    <SelectItem value="Petit Formal Script">Petit Formal Script</SelectItem>
                    <SelectItem value="Petrona">Petrona</SelectItem>
                    <SelectItem value="Philosopher">Philosopher</SelectItem>
                    <SelectItem value="Piedra">Piedra</SelectItem>
                    <SelectItem value="Pinyon Script">Pinyon Script</SelectItem>
                    <SelectItem value="Pirata One">Pirata One</SelectItem>
                    <SelectItem value="Plaster">Plaster</SelectItem>
                    <SelectItem value="Play">Play</SelectItem>
                    <SelectItem value="Playball">Playball</SelectItem>
                    <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                    <SelectItem value="Playfair Display SC">Playfair Display SC</SelectItem>
                    <SelectItem value="Podkova">Podkova</SelectItem>
                    <SelectItem value="Poiret One">Poiret One</SelectItem>
                    <SelectItem value="Poller One">Poller One</SelectItem>
                    <SelectItem value="Poly">Poly</SelectItem>
                    <SelectItem value="Pompiere">Pompiere</SelectItem>
                    <SelectItem value="Pontano Sans">Pontano Sans</SelectItem>
                    <SelectItem value="Port Lligat Sans">Port Lligat Sans</SelectItem>
                    <SelectItem value="Port Lligat Slab">Port Lligat Slab</SelectItem>
                    <SelectItem value="Pragati Narrow">Pragati Narrow</SelectItem>
                    <SelectItem value="Prata">Prata</SelectItem>
                    <SelectItem value="Preahvihear">Preahvihear</SelectItem>
                    <SelectItem value="Press Start 2P">Press Start 2P</SelectItem>
                    <SelectItem value="Princess Sofia">Princess Sofia</SelectItem>
                    <SelectItem value="Prociono">Prociono</SelectItem>
                    <SelectItem value="Prosto One">Prosto One</SelectItem>
                    <SelectItem value="Puritan">Puritan</SelectItem>
                    <SelectItem value="Purple Purse">Purple Purse</SelectItem>
                    <SelectItem value="Quando">Quando</SelectItem>
                    <SelectItem value="Quantico">Quantico</SelectItem>
                    <SelectItem value="Quattrocento">Quattrocento</SelectItem>
                    <SelectItem value="Quattrocento Sans">Quattrocento Sans</SelectItem>
                    <SelectItem value="Questrial">Questrial</SelectItem>
                    <SelectItem value="Quicksand">Quicksand</SelectItem>
                    <SelectItem value="Quintessential">Quintessential</SelectItem>
                    <SelectItem value="Qwigley">Qwigley</SelectItem>
                    <SelectItem value="Racing Sans One">Racing Sans One</SelectItem>
                    <SelectItem value="Radley">Radley</SelectItem>
                    <SelectItem value="Raleway">Raleway</SelectItem>
                    <SelectItem value="Raleway Dots">Raleway Dots</SelectItem>
                    <SelectItem value="Ramabhadra">Ramabhadra</SelectItem>
                    <SelectItem value="Ramaraja">Ramaraja</SelectItem>
                    <SelectItem value="Rambla">Rambla</SelectItem>
                    <SelectItem value="Rammetto One">Rammetto One</SelectItem>
                    <SelectItem value="Ranchers">Ranchers</SelectItem>
                    <SelectItem value="Rancho">Rancho</SelectItem>
                    <SelectItem value="Ranga">Ranga</SelectItem>
                    <SelectItem value="Rationale">Rationale</SelectItem>
                    <SelectItem value="Ravi Prakash">Ravi Prakash</SelectItem>
                    <SelectItem value="Redressed">Redressed</SelectItem>
                    <SelectItem value="Reenie Beanie">Reenie Beanie</SelectItem>
                    <SelectItem value="Revalia">Revalia</SelectItem>
                    <SelectItem value="Ribeye">Ribeye</SelectItem>
                    <SelectItem value="Ribeye Marrow">Ribeye Marrow</SelectItem>
                    <SelectItem value="Righteous">Righteous</SelectItem>
                    <SelectItem value="Risque">Risque</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Roboto Condensed">Roboto Condensed</SelectItem>
                    <SelectItem value="Roboto Mono">Roboto Mono</SelectItem>
                    <SelectItem value="Roboto Slab">Roboto Slab</SelectItem>
                    <SelectItem value="Rochester">Rochester</SelectItem>
                    <SelectItem value="Rock Salt">Rock Salt</SelectItem>
                    <SelectItem value="Rokkitt">Rokkitt</SelectItem>
                    <SelectItem value="Romanesco">Romanesco</SelectItem>
                    <SelectItem value="Ropa Sans">Ropa Sans</SelectItem>
                    <SelectItem value="Rosario">Rosario</SelectItem>
                    <SelectItem value="Rosarivo">Rosarivo</SelectItem>
                    <SelectItem value="Rouge Script">Rouge Script</SelectItem>
                    <SelectItem value="Rozha One">Rozha One</SelectItem>
                    <SelectItem value="Rubik">Rubik</SelectItem>
                    <SelectItem value="Rubik Mono One">Rubik Mono One</SelectItem>
                    <SelectItem value="Rubik One">Rubik One</SelectItem>
                    <SelectItem value="Ruda">Ruda</SelectItem>
                    <SelectItem value="Rufina">Rufina</SelectItem>
                    <SelectItem value="Ruge Boogie">Ruge Boogie</SelectItem>
                    <SelectItem value="Ruluko">Ruluko</SelectItem>
                    <SelectItem value="Rum Raisin">Rum Raisin</SelectItem>
                    <SelectItem value="Ruslan Display">Ruslan Display</SelectItem>
                    <SelectItem value="Russo One">Russo One</SelectItem>
                    <SelectItem value="Ruthie">Ruthie</SelectItem>
                    <SelectItem value="Rye">Rye</SelectItem>
                    <SelectItem value="Sacramento">Sacramento</SelectItem>
                    <SelectItem value="Sahitya">Sahitya</SelectItem>
                    <SelectItem value="Sail">Sail</SelectItem>
                    <SelectItem value="Salsa">Salsa</SelectItem>
                    <SelectItem value="Sanchez">Sanchez</SelectItem>
                    <SelectItem value="Sancreek">Sancreek</SelectItem>
                    <SelectItem value="Sansita">Sansita</SelectItem>
                    <SelectItem value="Sarabun">Sarabun</SelectItem>
                    <SelectItem value="Sarala">Sarala</SelectItem>
                    <SelectItem value="Sarina">Sarina</SelectItem>
                    <SelectItem value="Sarpanch">Sarpanch</SelectItem>
                    <SelectItem value="Satisfy">Satisfy</SelectItem>
                    <SelectItem value="Scada">Scada</SelectItem>
                    <SelectItem value="Scheherazade">Scheherazade</SelectItem>
                    <SelectItem value="Schoolbell">Schoolbell</SelectItem>
                    <SelectItem value="Scope One">Scope One</SelectItem>
                    <SelectItem value="Seaweed Script">Seaweed Script</SelectItem>
                    <SelectItem value="Sevillana">Sevillana</SelectItem>
                    <SelectItem value="Seymour One">Seymour One</SelectItem>
                    <SelectItem value="Shadows Into Light">Shadows Into Light</SelectItem>
                    <SelectItem value="Shadows Into Light Two">Shadows Into Light Two</SelectItem>
                    <SelectItem value="Shanti">Shanti</SelectItem>
                    <SelectItem value="Share">Share</SelectItem>
                    <SelectItem value="Share Tech">Share Tech</SelectItem>
                    <SelectItem value="Share Tech Mono">Share Tech Mono</SelectItem>
                    <SelectItem value="Shojumaru">Shojumaru</SelectItem>
                    <SelectItem value="Short Stack">Short Stack</SelectItem>
                    <SelectItem value="Shrikhand">Shrikhand</SelectItem>
                    <SelectItem value="Siemreap">Siemreap</SelectItem>
                    <SelectItem value="Sigmar One">Sigmar One</SelectItem>
                    <SelectItem value="Signika">Signika</SelectItem>
                    <SelectItem value="Signika Negative">Signika Negative</SelectItem>
                    <SelectItem value="Simonetta">Simonetta</SelectItem>
                    <SelectItem value="Sintony">Sintony</SelectItem>
                    <SelectItem value="Sirin Stencil">Sirin Stencil</SelectItem>
                    <SelectItem value="Six Caps">Six Caps</SelectItem>
                    <SelectItem value="Skranji">Skranji</SelectItem>
                    <SelectItem value="Slabo 13px">Slabo 13px</SelectItem>
                    <SelectItem value="Slabo 27px">Slabo 27px</SelectItem>
                    <SelectItem value="Slackey">Slackey</SelectItem>
                    <SelectItem value="Smokum">Smokum</SelectItem>
                    <SelectItem value="Smythe">Smythe</SelectItem>
                    <SelectItem value="Sniglet">Sniglet</SelectItem>
                    <SelectItem value="Snippet">Snippet</SelectItem>
                    <SelectItem value="Snowburst One">Snowburst One</SelectItem>
                    <SelectItem value="Sofadi One">Sofadi One</SelectItem>
                    <SelectItem value="Sofia">Sofia</SelectItem>
                    <SelectItem value="Sonsie One">Sonsie One</SelectItem>
                    <SelectItem value="Sorts Mill Goudy">Sorts Mill Goudy</SelectItem>
                    <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                    <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                    <SelectItem value="Source Serif Pro">Source Serif Pro</SelectItem>
                    <SelectItem value="Space Mono">Space Mono</SelectItem>
                    <SelectItem value="Special Elite">Special Elite</SelectItem>
                    <SelectItem value="Spectral">Spectral</SelectItem>
                    <SelectItem value="Spicy Rice">Spicy Rice</SelectItem>
                    <SelectItem value="Spinnaker">Spinnaker</SelectItem>
                    <SelectItem value="Spirax">Spirax</SelectItem>
                    <SelectItem value="Squada One">Squada One</SelectItem>
                    <SelectItem value="Sree Krushnadevaraya">Sree Krushnadevaraya</SelectItem>
                    <SelectItem value="Sriracha">Sriracha</SelectItem>
                    <SelectItem value="Srisakdi">Srisakdi</SelectItem>
                    <SelectItem value="Stalemate">Stalemate</SelectItem>
                    <SelectItem value="Stalinist One">Stalinist One</SelectItem>
                    <SelectItem value="Stardos Stencil">Stardos Stencil</SelectItem>
                    <SelectItem value="Stint Ultra Condensed">Stint Ultra Condensed</SelectItem>
                    <SelectItem value="Stint Ultra Expanded">Stint Ultra Expanded</SelectItem>
                    <SelectItem value="Stoke">Stoke</SelectItem>
                    <SelectItem value="Strait">Strait</SelectItem>
                    <SelectItem value="Sue Ellen Francisco">Sue Ellen Francisco</SelectItem>
                    <SelectItem value="Suez One">Suez One</SelectItem>
                    <SelectItem value="Sumana">Sumana</SelectItem>
                    <SelectItem value="Sunshiney">Sunshiney</SelectItem>
                    <SelectItem value="Supermercado One">Supermercado One</SelectItem>
                    <SelectItem value="Sura">Sura</SelectItem>
                    <SelectItem value="Suranna">Suranna</SelectItem>
                    <SelectItem value="Suravaram">Suravaram</SelectItem>
                    <SelectItem value="Suwannaphum">Suwannaphum</SelectItem>
                    <SelectItem value="Swanky and Moo Moo">Swanky and Moo Moo</SelectItem>
                    <SelectItem value="Syncopate">Syncopate</SelectItem>
                    <SelectItem value="Tangerine">Tangerine</SelectItem>
                    <SelectItem value="Taprom">Taprom</SelectItem>
                    <SelectItem value="Tauri">Tauri</SelectItem>
                    <SelectItem value="Taviraj">Taviraj</SelectItem>
                    <SelectItem value="Teko">Teko</SelectItem>
                    <SelectItem value="Telex">Telex</SelectItem>
                    <SelectItem value="Tenali Ramakrishna">Tenali Ramakrishna</SelectItem>
                    <SelectItem value="Tenor Sans">Tenor Sans</SelectItem>
                    <SelectItem value="Text Me One">Text Me One</SelectItem>
                    <SelectItem value="The Girl Next Door">The Girl Next Door</SelectItem>
                    <SelectItem value="Tienne">Tienne</SelectItem>
                    <SelectItem value="Tillana">Tillana</SelectItem>
                    <SelectItem value="Timmana">Timmana</SelectItem>
                    <SelectItem value="Tinos">Tinos</SelectItem>
                    <SelectItem value="Titan One">Titan One</SelectItem>
                    <SelectItem value="Titillium Web">Titillium Web</SelectItem>
                    <SelectItem value="Trade Winds">Trade Winds</SelectItem>
                    <SelectItem value="Trirong">Trirong</SelectItem>
                    <SelectItem value="Trocchi">Trocchi</SelectItem>
                    <SelectItem value="Trochut">Trochut</SelectItem>
                    <SelectItem value="Trykker">Trykker</SelectItem>
                    <SelectItem value="Tulpen One">Tulpen One</SelectItem>
                    <SelectItem value="Turret Road">Turret Road</SelectItem>
                    <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                    <SelectItem value="Ubuntu Condensed">Ubuntu Condensed</SelectItem>
                    <SelectItem value="Ubuntu Mono">Ubuntu Mono</SelectItem>
                    <SelectItem value="Ultra">Ultra</SelectItem>
                    <SelectItem value="Uncial Antiqua">Uncial Antiqua</SelectItem>
                    <SelectItem value="Underdog">Underdog</SelectItem>
                    <SelectItem value="Unica One">Unica One</SelectItem>
                    <SelectItem value="UnifrakturCook">UnifrakturCook</SelectItem>
                    <SelectItem value="UnifrakturMaguntia">UnifrakturMaguntia</SelectItem>
                    <SelectItem value="Unkempt">Unkempt</SelectItem>
                    <SelectItem value="Unlock">Unlock</SelectItem>
                    <SelectItem value="Unna">Unna</SelectItem>
                    <SelectItem value="VT323">VT323</SelectItem>
                    <SelectItem value="Vampiro One">Vampiro One</SelectItem>
                    <SelectItem value="Varela">Varela</SelectItem>
                    <SelectItem value="Varela Round">Varela Round</SelectItem>
                    <SelectItem value="Vast Shadow">Vast Shadow</SelectItem>
                    <SelectItem value="Vesper Libre">Vesper Libre</SelectItem>
                    <SelectItem value="Vibur">Vibur</SelectItem>
                    <SelectItem value="Vidaloka">Vidaloka</SelectItem>
                    <SelectItem value="Viga">Viga</SelectItem>
                    <SelectItem value="Voces">Voces</SelectItem>
                    <SelectItem value="Volkhov">Volkhov</SelectItem>
                    <SelectItem value="Vollkorn">Vollkorn</SelectItem>
                    <SelectItem value="Voltaire">Voltaire</SelectItem>
                    <SelectItem value="Waiting for the Sunrise">Waiting for the Sunrise</SelectItem>
                    <SelectItem value="Wallpoet">Wallpoet</SelectItem>
                    <SelectItem value="Walter Turncoat">Walter Turncoat</SelectItem>
                    <SelectItem value="Warnes">Warnes</SelectItem>
                    <SelectItem value="Wellfleet">Wellfleet</SelectItem>
                    <SelectItem value="Wendy One">Wendy One</SelectItem>
                    <SelectItem value="Wire One">Wire One</SelectItem>
                    <SelectItem value="Work Sans">Work Sans</SelectItem>
                    <SelectItem value="Yanone Kaffeesatz">Yanone Kaffeesatz</SelectItem>
                    <SelectItem value="Yantramanav">Yantramanav</SelectItem>
                    <SelectItem value="Yatra One">Yatra One</SelectItem>
                    <SelectItem value="Yellowtail">Yellowtail</SelectItem>
                    <SelectItem value="Yeseva One">Yeseva One</SelectItem>
                    <SelectItem value="Yesteryear">Yesteryear</SelectItem>
                    <SelectItem value="Yinmar">Yinmar</SelectItem>
                    <SelectItem value="Yrsa">Yrsa</SelectItem>
                    <SelectItem value="Zeyada">Zeyada</SelectItem>
                    <SelectItem value="Zilla Slab">Zilla Slab</SelectItem>
                    <SelectItem value="Zilla Slab Highlight">Zilla Slab Highlight</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </ResponsiveStyleControl>
          </div>
        </CollapsibleGroup>
      )}
    </div>
  );
};