import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Monitor, Smartphone, ChevronDown, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SpacingSliders } from './_shared/SpacingSliders';
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';

interface ImageFeatureElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const ImageFeatureElementStyles: React.FC<ImageFeatureElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  // Responsive controls state
  const [responsiveTab, setResponsiveTab] = React.useState<'desktop' | 'mobile'>('desktop');
  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentStyles = (responsiveStyles as any)[responsiveTab] || {};
  
  // Local state for smooth slider interactions
  const [tempFontSizes, setTempFontSizes] = React.useState<Record<string, number>>({});
  const [tempLineHeights, setTempLineHeights] = React.useState<Record<string, number>>({});
  
  // Collapsible state
  const [headlineTypographyOpen, setHeadlineTypographyOpen] = React.useState(true);
  const [descriptionTypographyOpen, setDescriptionTypographyOpen] = React.useState(false);
  const [elementAlignmentOpen, setElementAlignmentOpen] = React.useState(false);
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

  const TypographyGroup = ({
    title,
    prefix,
    isOpen,
    setIsOpen,
    defaultFontSize = '16px'
  }: {
    title: string;
    prefix: string;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    defaultFontSize?: string;
  }) => {
    const fontFamilyProperty = `${prefix}FontFamily`;
    const fontSizeProperty = `${prefix}FontSize`;
    const textAlignProperty = `${prefix}TextAlign`;
    const lineHeightProperty = `${prefix}LineHeight`;
    const colorProperty = `${prefix}Color`;

    const currentFontFamily = (currentStyles[fontFamilyProperty] || element.styles?.[fontFamilyProperty] || '').trim();
    const selectedFontValue = (fontOptions.find((f: any) => f.value === currentFontFamily)?.value as string) || 'default';

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div>
            <Label className="text-xs">Font Family</Label>
            <Select value={selectedFontValue} onValueChange={(v) => {
              const meta = (fontOptions as any[]).find((f: any) => f.value === v);
              if (meta && meta.family) ensureGoogleFontLoaded(meta.family, meta.weights);
              if (v === 'default') {
                handleResponsiveUpdate(fontFamilyProperty, '');
              } else {
                handleResponsiveUpdate(fontFamilyProperty, v);
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
                value={[tempFontSizes[fontSizeProperty] ?? parseInt(((currentStyles[fontSizeProperty] || element.styles?.[fontSizeProperty] || defaultFontSize).toString()).replace(/\D/g, ''))]}
                onValueChange={(value) => {
                  setTempFontSizes(prev => ({ ...prev, [fontSizeProperty]: value[0] }));
                }}
                onValueCommit={(value) => {
                  handleResponsiveUpdate(fontSizeProperty, `${value[0]}px`);
                  setTempFontSizes(prev => {
                    const updated = { ...prev };
                    delete updated[fontSizeProperty];
                    return updated;
                  });
                }}
                max={72}
                min={8}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {tempFontSizes[fontSizeProperty] ? `${tempFontSizes[fontSizeProperty]}px` : (currentStyles[fontSizeProperty] || element.styles?.[fontSizeProperty] || defaultFontSize) as string}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Text Align</Label>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant={(currentStyles[textAlignProperty] || element.styles?.[textAlignProperty]) === 'left' ? 'default' : 'outline'}
                onClick={() => handleResponsiveUpdate(textAlignProperty, 'left')}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={(currentStyles[textAlignProperty] || element.styles?.[textAlignProperty]) === 'center' ? 'default' : 'outline'}
                onClick={() => handleResponsiveUpdate(textAlignProperty, 'center')}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={(currentStyles[textAlignProperty] || element.styles?.[textAlignProperty]) === 'right' ? 'default' : 'outline'}
                onClick={() => handleResponsiveUpdate(textAlignProperty, 'right')}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs">Line Height</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[tempLineHeights[lineHeightProperty] ?? parseFloat(((currentStyles[lineHeightProperty] ?? element.styles?.[lineHeightProperty] ?? '1.6').toString()))]}
                onValueChange={(value) => {
                  setTempLineHeights(prev => ({ ...prev, [lineHeightProperty]: value[0] }));
                }}
                onValueCommit={(value) => {
                  handleResponsiveUpdate(lineHeightProperty, value[0].toString());
                  setTempLineHeights(prev => {
                    const updated = { ...prev };
                    delete updated[lineHeightProperty];
                    return updated;
                  });
                }}
                max={3}
                min={1}
                step={0.1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {tempLineHeights[lineHeightProperty] ? tempLineHeights[lineHeightProperty].toFixed(1) : (currentStyles[lineHeightProperty] || element.styles?.[lineHeightProperty] || '1.6') as string}
              </span>
            </div>
          </div>

          <ColorPicker 
            label="Text Color"
            color={(currentStyles[colorProperty] || element.styles?.[colorProperty]) || ''}
            onChange={(val) => handleResponsiveUpdate(colorProperty, val)}
          />
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-4">
      {/* Device Toggle */}
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

      {/* Typography Groups */}
      <TypographyGroup
        title="Headline Typography"
        prefix="headline"
        isOpen={headlineTypographyOpen}
        setIsOpen={setHeadlineTypographyOpen}
        defaultFontSize="24px"
      />

      <TypographyGroup
        title="Description Typography"
        prefix="description"
        isOpen={descriptionTypographyOpen}
        setIsOpen={setDescriptionTypographyOpen}
        defaultFontSize="16px"
      />


      {/* Background */}
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

      {/* Border */}
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
              placeholder="e.g., 8px"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Spacing */}
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
    </div>
  );
};