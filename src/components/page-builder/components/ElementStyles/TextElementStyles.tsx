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
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';
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
  // Responsive controls state and helpers
  const [responsiveTab, setResponsiveTab] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const responsiveStyles = element.styles?.responsive || { desktop: {}, tablet: {}, mobile: {} };
  const currentStyles = (responsiveStyles as any)[responsiveTab] || {};
  
  // Collapsible state
  const [typographyOpen, setTypographyOpen] = React.useState(true);
  const [backgroundOpen, setBackgroundOpen] = React.useState(false);
  const [borderOpen, setBorderOpen] = React.useState(false);
  const [spacingOpen, setSpacingOpen] = React.useState(false);
  
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

  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', '')) || 0;
  };

  const handleSpacingChange = (property: string, value: string) => {
    handleResponsiveUpdate(property, value);
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
    ];
    return [...base, ...google];
  }, []);

  const currentFontFamily = (currentStyles.fontFamily || element.styles?.fontFamily || '').trim();
  const selectedFontValue = (fontOptions.find((f: any) => f.value === currentFontFamily)?.value as string) || 'default';
  return (
    <div className="space-y-4">
      {/* Device Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Device</Label>
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant={responsiveTab === 'desktop' ? 'default' : 'outline'}
            onClick={() => setResponsiveTab('desktop')}
          >
            <Monitor className="h-3 w-3" /> 
          </Button>
          <Button
            size="sm"
            variant={responsiveTab === 'tablet' ? 'default' : 'outline'}
            onClick={() => setResponsiveTab('tablet')}
          >
            <Tablet className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant={responsiveTab === 'mobile' ? 'default' : 'outline'}
            onClick={() => setResponsiveTab('mobile')}
          >
            <Smartphone className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Typography */}
      {showTypography && (
        <Collapsible open={typographyOpen} onOpenChange={setTypographyOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Typography</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${typographyOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Font Family</Label>
              <Select value={selectedFontValue} onValueChange={(v) => {
                const meta = (fontOptions as any[]).find((f: any) => f.value === v);
                if (meta && meta.family) ensureGoogleFontLoaded(meta.family, meta.weights);
                if (v === 'default') {
                  handleResponsiveUpdate('fontFamily', '');
                } else {
                  handleResponsiveUpdate('fontFamily', v);
                }
              }}>
                <SelectTrigger className="h-8 bg-background">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  {(fontOptions as any[]).map((f: any) => (
                    <SelectItem key={f.label} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Font Size</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[parseInt(((currentStyles.fontSize || element.styles?.fontSize || '16px').toString()).replace(/\D/g, ''))]}
                  onValueChange={(value) => handleResponsiveUpdate('fontSize', `${value[0]}px`)}
                  max={72}
                  min={8}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {(currentStyles.fontSize || element.styles?.fontSize || '16px') as string}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-xs">Text Align</Label>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={(currentStyles.textAlign || element.styles?.textAlign) === 'left' ? 'default' : 'outline'}
                  onClick={() => handleResponsiveUpdate('textAlign', 'left')}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={(currentStyles.textAlign || element.styles?.textAlign) === 'center' ? 'default' : 'outline'}
                  onClick={() => handleResponsiveUpdate('textAlign', 'center')}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={(currentStyles.textAlign || element.styles?.textAlign) === 'right' ? 'default' : 'outline'}
                  onClick={() => handleResponsiveUpdate('textAlign', 'right')}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs">Line Height</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[parseFloat(((currentStyles.lineHeight ?? element.styles?.lineHeight ?? '1.6').toString()))]}
                  onValueChange={(value) => handleResponsiveUpdate('lineHeight', value[0].toString())}
                  max={3}
                  min={1}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {(currentStyles.lineHeight || element.styles?.lineHeight || '1.6') as string}
                </span>
              </div>
            </div>

            <ColorPicker 
              label="Text Color"
              color={(currentStyles.color || element.styles?.color) || ''}
              onChange={(val) => handleResponsiveUpdate('color', val)}
            />
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
            <ColorPicker 
              label="Background Color"
              color={(currentStyles.backgroundColor || element.styles?.backgroundColor) || ''}
              onChange={(val) => handleResponsiveUpdate('backgroundColor', val)}
            />
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
            <div>
              <Label className="text-xs">Border Width</Label>
              <Input
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
              <Input
                value={(currentStyles.borderRadius || element.styles?.borderRadius) || ''}
                onChange={(e) => handleResponsiveUpdate('borderRadius', e.target.value)}
                placeholder="e.g., 4px"
              />
            </div>
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
            <SpacingSliders
              marginTop={currentStyles.marginTop || element.styles?.marginTop}
              marginRight={currentStyles.marginRight || element.styles?.marginRight}
              marginBottom={currentStyles.marginBottom || element.styles?.marginBottom}
              marginLeft={currentStyles.marginLeft || element.styles?.marginLeft}
              paddingTop={currentStyles.paddingTop || element.styles?.paddingTop}
              paddingRight={currentStyles.paddingRight || element.styles?.paddingRight}
              paddingBottom={currentStyles.paddingBottom || element.styles?.paddingBottom}
              paddingLeft={currentStyles.paddingLeft || element.styles?.paddingLeft}
              onMarginChange={handleSpacingChange}
              onPaddingChange={handleSpacingChange}
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