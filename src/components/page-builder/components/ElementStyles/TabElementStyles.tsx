import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { ResponsiveSpacingSliders } from './_shared/ResponsiveSpacingSliders';
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';

interface TabElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

// Helper function to ensure responsive structure
const ensureResponsive = (base: any) => {
  if (!base?.responsive) {
    return {
      responsive: {
        desktop: {},
        mobile: {}
      }
    };
  }
  return base;
};

// Typography group component
const TypographyGroup: React.FC<{
  label: string;
  styles: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
}> = ({ label, styles, onChange }) => {
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

  const currentFontFamily = (styles.fontFamily || '').trim();
  const selectedFontValue = (fontOptions.find((f: any) => f.value === currentFontFamily)?.value as string) || 'default';

  React.useEffect(() => {
    if (selectedFontValue !== 'default' && fontOptions.find((f: any) => f.value === selectedFontValue)?.family) {
      const font = fontOptions.find((f: any) => f.value === selectedFontValue);
      if (font?.family && font?.weights) {
        ensureGoogleFontLoaded(font.family, font.weights);
      }
    }
  }, [selectedFontValue, fontOptions]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Font Family</Label>
        <Select
          value={selectedFontValue}
          onValueChange={(value) => {
            const font = fontOptions.find((f: any) => f.value === value);
            onChange({ fontFamily: font?.value || value });
          }}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((font: any) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Font Size</Label>
          <div className="space-y-1">
            <Slider
              value={[parseInt(styles.fontSize) || 16]}
              onValueChange={(value) => onChange({ fontSize: `${value[0]}px` })}
              max={72}
              min={8}
              step={1}
            />
            <span className="text-xs text-muted-foreground">{parseInt(styles.fontSize) || 16}px</span>
          </div>
        </div>
        
        <div>
          <Label className="text-xs">Line Height</Label>
          <div className="space-y-1">
            <Slider
              value={[parseFloat(styles.lineHeight) || 1.4]}
              onValueChange={(value) => onChange({ lineHeight: value[0].toString() })}
              max={3}
              min={0.8}
              step={0.1}
            />
            <span className="text-xs text-muted-foreground">{parseFloat(styles.lineHeight) || 1.4}</span>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs">Text Color</Label>
        <ColorPicker
          color={styles.color || '#000000'}
          onChange={(color) => onChange({ color })}
        />
      </div>

      <div>
        <Label className="text-xs">Font Weight</Label>
        <Select
          value={styles.fontWeight || '400'}
          onValueChange={(value) => onChange({ fontWeight: value })}
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
  );
};

export const TabElementStyles: React.FC<TabElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [isTabLabelTypographyOpen, setIsTabLabelTypographyOpen] = React.useState(true);
  const [isTabContentTypographyOpen, setIsTabContentTypographyOpen] = React.useState(true);
  const [isTabListStylesOpen, setIsTabListStylesOpen] = React.useState(false);
  const [isBackgroundOpen, setIsBackgroundOpen] = React.useState(false);
  const [isBorderOpen, setIsBorderOpen] = React.useState(false);
  const [isSpacingOpen, setIsSpacingOpen] = React.useState(false);
  
  const styles = element.styles || {};

  const getTabLabelStyles = () =>
    ensureResponsive((styles as any).tabLabelStyles).responsive[device] || {};

  const getTabContentStyles = () =>
    ensureResponsive((styles as any).tabContentStyles).responsive[device] || {};

  const getTabListStyles = () =>
    ensureResponsive((styles as any).tabListStyles).responsive[device] || {};

  const updateTabLabelStyles = (patch: Record<string, any>) => {
    const base = ensureResponsive((styles as any).tabLabelStyles);
    base.responsive[device] = { ...(base.responsive[device] || {}), ...patch };
    onStyleUpdate('tabLabelStyles', base);
  };

  const updateTabContentStyles = (patch: Record<string, any>) => {
    const base = ensureResponsive((styles as any).tabContentStyles);
    base.responsive[device] = { ...(base.responsive[device] || {}), ...patch };
    onStyleUpdate('tabContentStyles', base);
  };

  const updateTabListStyles = (patch: Record<string, any>) => {
    const base = ensureResponsive((styles as any).tabListStyles);
    base.responsive[device] = { ...(base.responsive[device] || {}), ...patch };
    onStyleUpdate('tabListStyles', base);
  };

  const handleResponsiveUpdate = (property: string, value: any) => {
    const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
    const updatedResponsive = {
      ...responsiveStyles,
      [device]: {
        ...responsiveStyles[device],
        [property]: value,
      },
    };
    onStyleUpdate('responsive', updatedResponsive);
  };

  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', '')) || 0;
  };

  // Helper functions for device-aware spacing conversion
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

  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentStyles = (responsiveStyles as any)[device] || {};

  return (
    <div className="space-y-4">
      {/* Device Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Device</Label>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={device === 'desktop' ? 'default' : 'outline'}
            onClick={() => setDevice('desktop')}
          >
            <Monitor className="h-4 w-4 mr-1" /> Desktop
          </Button>
          <Button
            size="sm"
            variant={device === 'mobile' ? 'default' : 'outline'}
            onClick={() => setDevice('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-1" /> Mobile
          </Button>
        </div>
      </div>

      {/* Tab Label Typography Section */}
      <CollapsibleGroup
        title="Tab Label Typography"
        isOpen={isTabLabelTypographyOpen}
        onToggle={setIsTabLabelTypographyOpen}
      >
        <TypographyGroup 
          label="Tab Label Styling" 
          styles={getTabLabelStyles()} 
          onChange={updateTabLabelStyles} 
        />
      </CollapsibleGroup>

      {/* Tab Content Typography Section */}
      <CollapsibleGroup
        title="Tab Content Typography"
        isOpen={isTabContentTypographyOpen}
        onToggle={setIsTabContentTypographyOpen}
      >
        <TypographyGroup 
          label="Tab Content Styling" 
          styles={getTabContentStyles()} 
          onChange={updateTabContentStyles} 
        />
      </CollapsibleGroup>

      {/* Tab List Styles Section */}
      <CollapsibleGroup
        title="Tab List Styles"
        isOpen={isTabListStylesOpen}
        onToggle={setIsTabListStylesOpen}
      >
        <div className="space-y-3">
          <ColorPicker 
            label="Background Color"
            color={getTabListStyles().backgroundColor || ''}
            onChange={(val) => updateTabListStyles({ backgroundColor: val })}
          />
          <ColorPicker 
            label="Border Color"
            color={getTabListStyles().borderColor || ''}
            onChange={(val) => updateTabListStyles({ borderColor: val })}
          />
          <div>
            <Label className="text-xs">Border Width</Label>
            <input
              type="text"
              className="w-full h-8 px-3 border rounded bg-background text-sm mt-2"
              value={getTabListStyles().borderWidth || ''}
              onChange={(e) => updateTabListStyles({ borderWidth: e.target.value })}
              placeholder="e.g., 1px"
            />
          </div>
          <div>
            <Label className="text-xs">Border Radius</Label>
            <input
              type="text"
              className="w-full h-8 px-3 border rounded bg-background text-sm mt-2"
              value={getTabListStyles().borderRadius || ''}
              onChange={(e) => updateTabListStyles({ borderRadius: e.target.value })}
              placeholder="e.g., 4px"
            />
          </div>
          <div>
            <Label className="text-xs">Padding</Label>
            <input
              type="text"
              className="w-full h-8 px-3 border rounded bg-background text-sm mt-2"
              value={getTabListStyles().padding || ''}
              onChange={(e) => updateTabListStyles({ padding: e.target.value })}
              placeholder="e.g., 8px"
            />
          </div>
        </div>
      </CollapsibleGroup>

      {/* Background Section */}
      <CollapsibleGroup
        title="Background"
        isOpen={isBackgroundOpen}
        onToggle={setIsBackgroundOpen}
      >
        <ColorPicker 
          label="Background Color"
          color={(currentStyles.backgroundColor || element.styles?.backgroundColor) || ''}
          onChange={(val) => handleResponsiveUpdate('backgroundColor', val)}
        />
      </CollapsibleGroup>

      {/* Border Section */}
      <CollapsibleGroup
        title="Border"
        isOpen={isBorderOpen}
        onToggle={setIsBorderOpen}
      >
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Border Width</Label>
            <input
              type="text"
              className="w-full h-8 px-3 border rounded bg-background text-sm"
              value={(currentStyles.borderWidth || element.styles?.borderWidth) || ''}
              onChange={(e) => handleResponsiveUpdate('borderWidth', e.target.value)}
              placeholder="e.g., 1px"
            />
          </div>

          <ColorPicker 
            label="Border Color"
            color={(currentStyles.borderColor || element.styles?.borderColor) || ''}
            onChange={(val) => handleResponsiveUpdate('borderColor', val)}
          />

          <div>
            <Label className="text-xs">Border Radius</Label>
            <input
              type="text"
              className="w-full h-8 px-3 border rounded bg-background text-sm"
              value={(currentStyles.borderRadius || element.styles?.borderRadius) || ''}
              onChange={(e) => handleResponsiveUpdate('borderRadius', e.target.value)}
              placeholder="e.g., 4px"
            />
          </div>
        </div>
      </CollapsibleGroup>

      {/* Spacing Section */}
      <CollapsibleGroup
        title="Spacing"
        isOpen={isSpacingOpen}
        onToggle={setIsSpacingOpen}
      >
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

