import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Tablet, Smartphone, ChevronDown } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SpacingSliders } from './_shared/SpacingSliders';
import { ResponsiveSpacingSliders } from './_shared/ResponsiveSpacingSliders';
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';
import { ResponsiveStyleControl, ResponsiveTabs } from './_shared/ResponsiveStyleControl';
import { useDevicePreview } from '../../contexts/DevicePreviewContext';
interface TextElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
  showTypography?: boolean;
  showBackground?: boolean;
  showBorder?: boolean;
  showSpacing?: boolean;
}

export const TextElementStyles: React.FC<TextElementStylesProps> = ({
  element,
  onStyleUpdate,
  showTypography = true,
  showBackground = true,
  showBorder = true,
  showSpacing = true,
}) => {
  // Use global device state instead of local state
  const { deviceType: responsiveTab, setDeviceType: setResponsiveTab } = useDevicePreview();
  
  // Collapsible state
  const [typographyOpen, setTypographyOpen] = React.useState(true);
  const [backgroundOpen, setBackgroundOpen] = React.useState(false);
  const [borderOpen, setBorderOpen] = React.useState(false);
  const [spacingOpen, setSpacingOpen] = React.useState(false);

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

      {/* Typography */}
      {showTypography && (
        <Collapsible open={typographyOpen} onOpenChange={setTypographyOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Typography</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${typographyOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
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
              fallback={(() => {
                // Dynamic fallback based on heading level for heading elements
                if (element.type === 'heading' && element.content?.level) {
                  const headingFontSizes = {
                    1: '48px',  // text-4xl
                    2: '40px',  // text-3xl  
                    3: '32px',  // text-2xl
                    4: '24px',  // text-xl
                    5: '20px',  // text-lg
                    6: '16px',  // text-base
                  };
                  return headingFontSizes[element.content.level as keyof typeof headingFontSizes] || '16px';
                }
                return '16px';
              })()}
              onStyleUpdate={onStyleUpdate}
            >
              {(value, onChange) => (
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[parseInt(value.toString().replace(/\D/g, ''))]}
                    onValueChange={(val) => onChange(`${val[0]}px`)}
                    max={72}
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

            <ResponsiveStyleControl
              element={element}
              property="lineHeight"
              label="Line Height"
              deviceType={responsiveTab}
              fallback="1.6"
              onStyleUpdate={onStyleUpdate}
            >
              {(value, onChange) => (
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[parseFloat(value.toString())]}
                    onValueChange={(val) => onChange(val[0].toString())}
                    max={3}
                    min={1}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {value}
                  </span>
                </div>
              )}
            </ResponsiveStyleControl>

            {!['navigation-menu'].includes(element.type) && (
              <ResponsiveStyleControl
                element={element}
                property="color"
                label="Text Color"
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
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {showBackground && (
        <Collapsible open={backgroundOpen} onOpenChange={setBackgroundOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Background</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${backgroundOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <ResponsiveStyleControl
              element={element}
              property="backgroundColor"
              label="Background Color"
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
          </CollapsibleContent>
        </Collapsible>
      )}

      {showBorder && (
        <Collapsible open={borderOpen} onOpenChange={setBorderOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Border</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${borderOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
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
              property="borderRadius"
              label="Border Radius"
              deviceType={responsiveTab}
              fallback=""
              onStyleUpdate={onStyleUpdate}
            >
              {(value, onChange) => (
                <Input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="e.g., 4px"
                />
              )}
            </ResponsiveStyleControl>
          </CollapsibleContent>
        </Collapsible>
      )}

      {showSpacing && (
        <Collapsible open={spacingOpen} onOpenChange={setSpacingOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${spacingOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <ResponsiveSpacingSliders
              marginByDevice={getCurrentSpacingByDevice().marginByDevice}
              paddingByDevice={getCurrentSpacingByDevice().paddingByDevice}
              onMarginChange={handleMarginChange}
              onPaddingChange={handlePaddingChange}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Ecommerce-specific: Button Styles */}
      {['product-grid', 'featured-products'].includes(element.type) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Button Styles</h4>
            <ColorPicker 
              label="Text Color"
              color={(element.styles as any)?.buttonStyles?.color || ''}
              onChange={(val) => onStyleUpdate('buttonStyles', { ...(element.styles as any)?.buttonStyles, color: val })}
            />
            <ColorPicker 
              label="Background Color"
              color={(element.styles as any)?.buttonStyles?.backgroundColor || ''}
              onChange={(val) => onStyleUpdate('buttonStyles', { ...(element.styles as any)?.buttonStyles, backgroundColor: val })}
            />
          </div>
        </>
      )}
    </div>
  );
};