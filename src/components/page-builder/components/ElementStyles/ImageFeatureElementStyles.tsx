import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Monitor, Smartphone, ChevronDown, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';
import { ResponsiveStyleControl, ResponsiveTabs } from './_shared/ResponsiveStyleControl';
import { useDevicePreview } from '../../contexts/DevicePreviewContext';
import { FontSizeControl } from './_shared/FontSizeControl';
import { LineHeightControl } from './_shared/LineHeightControl';
import { SpacingControl } from './_shared/SpacingControl';

interface ImageFeatureElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const ImageFeatureElementStyles: React.FC<ImageFeatureElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  const { deviceType: responsiveTab, setDeviceType: setResponsiveTab } = useDevicePreview();
  
  // Collapsible state
  const [headlineTypographyOpen, setHeadlineTypographyOpen] = React.useState(true);
  const [descriptionTypographyOpen, setDescriptionTypographyOpen] = React.useState(false);
  const [backgroundOpen, setBackgroundOpen] = React.useState(false);
  const [borderOpen, setBorderOpen] = React.useState(false);
  const [spacingOpen, setSpacingOpen] = React.useState(false);
  const [imageOpen, setImageOpen] = React.useState(false);

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

  // Typography Group Component
  const TypographyGroup: React.FC<{
    title: string;
    fontFamilyProperty: string;
    fontSizeProperty: string;
    textAlignProperty: string;
    lineHeightProperty: string;
    colorProperty: string;
    defaultFontSize: string;
    defaultLineHeight: string;
    isOpen: boolean;
    onToggle: (open: boolean) => void;
  }> = ({ 
    title, 
    fontFamilyProperty, 
    fontSizeProperty, 
    textAlignProperty, 
    lineHeightProperty, 
    colorProperty,
    defaultFontSize,
    defaultLineHeight,
    isOpen,
    onToggle
  }) => (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</h4>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2">
        <ResponsiveStyleControl
          element={element}
          property={fontFamilyProperty}
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
          property={fontSizeProperty}
          label="Font Size"
          deviceType={responsiveTab}
          fallback={defaultFontSize}
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <FontSizeControl
              value={value}
              onChange={onChange}
              min={8}
              max={72}
              defaultSize={defaultFontSize}
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property={textAlignProperty}
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
          property={lineHeightProperty}
          label="Line Height"
          deviceType={responsiveTab}
          fallback={defaultLineHeight}
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <LineHeightControl
              value={value}
              onChange={onChange}
              min={1}
              max={3}
              step={0.1}
              defaultHeight={defaultLineHeight}
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property={colorProperty}
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
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className="space-y-4">
      {/* Device Toggle */}
      <ResponsiveTabs activeTab={responsiveTab} onTabChange={setResponsiveTab} />

      {/* Headline Typography */}
      <TypographyGroup
        title="Headline Typography"
        fontFamilyProperty="headlineFontFamily"
        fontSizeProperty="headlineFontSize"
        textAlignProperty="headlineTextAlign"
        lineHeightProperty="headlineLineHeight"
        colorProperty="headlineColor"
        defaultFontSize="24px"
        defaultLineHeight="1.4"
        isOpen={headlineTypographyOpen}
        onToggle={setHeadlineTypographyOpen}
      />

      {/* Description Typography */}
      <TypographyGroup
        title="Description Typography"
        fontFamilyProperty="descriptionFontFamily"
        fontSizeProperty="descriptionFontSize"
        textAlignProperty="descriptionTextAlign"
        lineHeightProperty="descriptionLineHeight"
        colorProperty="descriptionColor"
        defaultFontSize="16px"
        defaultLineHeight="1.6"
        isOpen={descriptionTypographyOpen}
        onToggle={setDescriptionTypographyOpen}
      />

      {/* Background */}
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

      {/* Border */}
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
                placeholder="e.g., 8px"
              />
            )}
          </ResponsiveStyleControl>
        </CollapsibleContent>
      </Collapsible>

      {/* Image */}
      <Collapsible open={imageOpen} onOpenChange={setImageOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Image</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${imageOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <ResponsiveStyleControl
            element={element}
            property="imagePosition"
            label="Image Position"
            deviceType={responsiveTab}
            fallback={(element.content as any)?.imagePosition || 'left'}
            onStyleUpdate={onStyleUpdate}
          >
            {(value, onChange) => (
              <Select value={value || 'left'} onValueChange={onChange}>
                <SelectTrigger className="h-8 bg-background">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            )}
          </ResponsiveStyleControl>
          
          <ResponsiveStyleControl
            element={element}
            property="imageMaxHeight"
            label="Max Height"
            deviceType={responsiveTab}
            fallback="400px"
            onStyleUpdate={onStyleUpdate}
          >
            {(value, onChange) => (
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g., 400px"
              />
            )}
          </ResponsiveStyleControl>
        </CollapsibleContent>
      </Collapsible>

      {/* Spacing */}
      <Collapsible open={spacingOpen} onOpenChange={setSpacingOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${spacingOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Margin</Label>
              <div className="space-y-3">
                <SpacingControl
                  element={element}
                  property="marginTop"
                  label="Top"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                />
                <SpacingControl
                  element={element}
                  property="marginRight"
                  label="Right"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                />
                <SpacingControl
                  element={element}
                  property="marginBottom"
                  label="Bottom"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                />
                <SpacingControl
                  element={element}
                  property="marginLeft"
                  label="Left"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Padding</Label>
              <div className="space-y-3">
                <SpacingControl
                  element={element}
                  property="paddingTop"
                  label="Top"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                />
                <SpacingControl
                  element={element}
                  property="paddingRight"
                  label="Right"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                />
                <SpacingControl
                  element={element}
                  property="paddingBottom"
                  label="Bottom"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                />
                <SpacingControl
                  element={element}
                  property="paddingLeft"
                  label="Left"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};