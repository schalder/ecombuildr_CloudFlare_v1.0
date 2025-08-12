import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [responsiveTab, setResponsiveTab] = React.useState<'desktop' | 'mobile'>('desktop');
  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentStyles = (responsiveStyles as any)[responsiveTab] || {};
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

  const currentFontFamily = (element.styles?.fontFamily || '').trim();
  const selectedFontValue = (fontOptions.find((f: any) => f.value === currentFontFamily)?.value as string) || 'default';
  return (
    <div className="space-y-4">
      {/* Typography */}
      {showTypography && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Typography</h4>
          <div className="flex items-center justify-between">
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
          
          <div>
            <Label className="text-xs">Font Family</Label>
            <Select value={selectedFontValue} onValueChange={(v) => {
              const meta = (fontOptions as any[]).find((f: any) => f.value === v);
              if (meta && meta.family) ensureGoogleFontLoaded(meta.family, meta.weights);
              if (v === 'default') {
                onStyleUpdate('fontFamily', '');
              } else {
                onStyleUpdate('fontFamily', v);
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
                variant={element.styles?.textAlign === 'left' ? 'default' : 'outline'}
                onClick={() => onStyleUpdate('textAlign', 'left')}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={element.styles?.textAlign === 'center' ? 'default' : 'outline'}
                onClick={() => onStyleUpdate('textAlign', 'center')}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={element.styles?.textAlign === 'right' ? 'default' : 'outline'}
                onClick={() => onStyleUpdate('textAlign', 'right')}
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
              color={element.styles?.color || ''}
              onChange={(val) => onStyleUpdate('color', val)}
            />
        </div>
      )}

      {showBackground && (
        <>
          <Separator />

          {/* Background */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Background</h4>
            
            <ColorPicker 
              label="Background Color"
              color={element.styles?.backgroundColor || ''}
              onChange={(val) => onStyleUpdate('backgroundColor', val)}
            />
          </div>
        </>
      )}

      {showBorder && (
        <>
          <Separator />

          {/* Border */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Border</h4>
            
            <div>
              <Label className="text-xs">Border Width</Label>
              <Input
                value={element.styles?.borderWidth || ''}
                onChange={(e) => onStyleUpdate('borderWidth', e.target.value)}
                placeholder="e.g., 1px"
              />
            </div>

            <ColorPicker 
              label="Border Color"
              color={element.styles?.borderColor || ''}
              onChange={(val) => onStyleUpdate('borderColor', val)}
            />

            <div>
              <Label className="text-xs">Border Radius</Label>
              <Input
                value={element.styles?.borderRadius || ''}
                onChange={(e) => onStyleUpdate('borderRadius', e.target.value)}
                placeholder="e.g., 4px"
              />
            </div>
          </div>
        </>
      )}

      {showSpacing && (
        <>
          <Separator />

          {/* Spacing */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</h4>
            {/* Margin per-side */}
            <div>
              <Label className="text-xs">Margin</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                <div>
                  <Label className="text-2xs text-muted-foreground">Top</Label>
                  <Input
                    value={(currentStyles.marginTop || element.styles?.marginTop || '') as string}
                    onChange={(e) => handleResponsiveUpdate('marginTop', e.target.value || '0px')}
                    placeholder="0px"
                  />
                </div>
                <div>
                  <Label className="text-2xs text-muted-foreground">Right</Label>
                  <Input
                    value={(currentStyles.marginRight || element.styles?.marginRight || '') as string}
                    onChange={(e) => handleResponsiveUpdate('marginRight', e.target.value || '0px')}
                    placeholder="0px"
                  />
                </div>
                <div>
                  <Label className="text-2xs text-muted-foreground">Bottom</Label>
                  <Input
                    value={(currentStyles.marginBottom || element.styles?.marginBottom || '') as string}
                    onChange={(e) => handleResponsiveUpdate('marginBottom', e.target.value || '0px')}
                    placeholder="0px"
                  />
                </div>
                <div>
                  <Label className="text-2xs text-muted-foreground">Left</Label>
                  <Input
                    value={(currentStyles.marginLeft || element.styles?.marginLeft || '') as string}
                    onChange={(e) => handleResponsiveUpdate('marginLeft', e.target.value || '0px')}
                    placeholder="0px"
                  />
                </div>
              </div>
            </div>

            {/* Padding per-side */}
            <div>
              <Label className="text-xs">Padding</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                <div>
                  <Label className="text-2xs text-muted-foreground">Top</Label>
                  <Input
                    value={(currentStyles.paddingTop || element.styles?.paddingTop || '') as string}
                    onChange={(e) => handleResponsiveUpdate('paddingTop', e.target.value || '0px')}
                    placeholder="0px"
                  />
                </div>
                <div>
                  <Label className="text-2xs text-muted-foreground">Right</Label>
                  <Input
                    value={(currentStyles.paddingRight || element.styles?.paddingRight || '') as string}
                    onChange={(e) => handleResponsiveUpdate('paddingRight', e.target.value || '0px')}
                    placeholder="0px"
                  />
                </div>
                <div>
                  <Label className="text-2xs text-muted-foreground">Bottom</Label>
                  <Input
                    value={(currentStyles.paddingBottom || element.styles?.paddingBottom || '') as string}
                    onChange={(e) => handleResponsiveUpdate('paddingBottom', e.target.value || '0px')}
                    placeholder="0px"
                  />
                </div>
                <div>
                  <Label className="text-2xs text-muted-foreground">Left</Label>
                  <Input
                    value={(currentStyles.paddingLeft || element.styles?.paddingLeft || '') as string}
                    onChange={(e) => handleResponsiveUpdate('paddingLeft', e.target.value || '0px')}
                    placeholder="0px"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
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