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
  const [alignmentOpen, setAlignmentOpen] = React.useState(false);
  const [backgroundOpen, setBackgroundOpen] = React.useState(false);
  const [borderOpen, setBorderOpen] = React.useState(false);
  const [spacingOpen, setSpacingOpen] = React.useState(false);

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
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(value.toString().replace(/\D/g, '')) || parseInt(defaultFontSize.replace(/\D/g, ''))]}
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
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseFloat(value.toString()) || parseFloat(defaultLineHeight)]}
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

      {/* Element Alignment */}
      <Collapsible open={alignmentOpen} onOpenChange={setAlignmentOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Element Alignment</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${alignmentOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <ResponsiveStyleControl
            element={element}
            property="textAlign"
            label="Alignment"
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
        </CollapsibleContent>
      </Collapsible>

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
                <ResponsiveStyleControl
                  element={element}
                  property="marginTop"
                  label="Top"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                >
                  {(value, onChange) => {
                    const parsePixelValue = (val: string | undefined): number => {
                      if (!val) return 0;
                      return parseInt(val.replace('px', '')) || 0;
                    };
                    
                    const handleSliderChange = (newValue: number) => {
                      onChange(`${newValue}px`);
                    };
                    
                    const handleInputChange = (inputValue: string) => {
                      const numValue = Math.max(0, Math.min(200, parseInt(inputValue) || 0));
                      onChange(`${numValue}px`);
                    };
                    
                    return (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-12">Top</Label>
                        <Slider
                          value={[parsePixelValue(value)]}
                          onValueChange={(val) => handleSliderChange(val[0])}
                          max={200}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={parsePixelValue(value)}
                          onChange={(e) => handleInputChange(e.target.value)}
                          min={0}
                          max={200}
                          step={1}
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-xs text-muted-foreground w-6">px</span>
                      </div>
                    );
                  }}
                </ResponsiveStyleControl>
                
                <ResponsiveStyleControl
                  element={element}
                  property="marginRight"
                  label="Right"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                >
                  {(value, onChange) => {
                    const parsePixelValue = (val: string | undefined): number => {
                      if (!val) return 0;
                      return parseInt(val.replace('px', '')) || 0;
                    };
                    
                    const handleSliderChange = (newValue: number) => {
                      onChange(`${newValue}px`);
                    };
                    
                    const handleInputChange = (inputValue: string) => {
                      const numValue = Math.max(0, Math.min(200, parseInt(inputValue) || 0));
                      onChange(`${numValue}px`);
                    };
                    
                    return (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-12">Right</Label>
                        <Slider
                          value={[parsePixelValue(value)]}
                          onValueChange={(val) => handleSliderChange(val[0])}
                          max={200}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={parsePixelValue(value)}
                          onChange={(e) => handleInputChange(e.target.value)}
                          min={0}
                          max={200}
                          step={1}
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-xs text-muted-foreground w-6">px</span>
                      </div>
                    );
                  }}
                </ResponsiveStyleControl>
                
                <ResponsiveStyleControl
                  element={element}
                  property="marginBottom"
                  label="Bottom"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                >
                  {(value, onChange) => {
                    const parsePixelValue = (val: string | undefined): number => {
                      if (!val) return 0;
                      return parseInt(val.replace('px', '')) || 0;
                    };
                    
                    const handleSliderChange = (newValue: number) => {
                      onChange(`${newValue}px`);
                    };
                    
                    const handleInputChange = (inputValue: string) => {
                      const numValue = Math.max(0, Math.min(200, parseInt(inputValue) || 0));
                      onChange(`${numValue}px`);
                    };
                    
                    return (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-12">Bottom</Label>
                        <Slider
                          value={[parsePixelValue(value)]}
                          onValueChange={(val) => handleSliderChange(val[0])}
                          max={200}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={parsePixelValue(value)}
                          onChange={(e) => handleInputChange(e.target.value)}
                          min={0}
                          max={200}
                          step={1}
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-xs text-muted-foreground w-6">px</span>
                      </div>
                    );
                  }}
                </ResponsiveStyleControl>
                
                <ResponsiveStyleControl
                  element={element}
                  property="marginLeft"
                  label="Left"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                >
                  {(value, onChange) => {
                    const parsePixelValue = (val: string | undefined): number => {
                      if (!val) return 0;
                      return parseInt(val.replace('px', '')) || 0;
                    };
                    
                    const handleSliderChange = (newValue: number) => {
                      onChange(`${newValue}px`);
                    };
                    
                    const handleInputChange = (inputValue: string) => {
                      const numValue = Math.max(0, Math.min(200, parseInt(inputValue) || 0));
                      onChange(`${numValue}px`);
                    };
                    
                    return (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-12">Left</Label>
                        <Slider
                          value={[parsePixelValue(value)]}
                          onValueChange={(val) => handleSliderChange(val[0])}
                          max={200}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={parsePixelValue(value)}
                          onChange={(e) => handleInputChange(e.target.value)}
                          min={0}
                          max={200}
                          step={1}
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-xs text-muted-foreground w-6">px</span>
                      </div>
                    );
                  }}
                </ResponsiveStyleControl>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Padding</Label>
              <div className="space-y-3">
                <ResponsiveStyleControl
                  element={element}
                  property="paddingTop"
                  label="Top"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                >
                  {(value, onChange) => {
                    const parsePixelValue = (val: string | undefined): number => {
                      if (!val) return 0;
                      return parseInt(val.replace('px', '')) || 0;
                    };
                    
                    const handleSliderChange = (newValue: number) => {
                      onChange(`${newValue}px`);
                    };
                    
                    const handleInputChange = (inputValue: string) => {
                      const numValue = Math.max(0, Math.min(200, parseInt(inputValue) || 0));
                      onChange(`${numValue}px`);
                    };
                    
                    return (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-12">Top</Label>
                        <Slider
                          value={[parsePixelValue(value)]}
                          onValueChange={(val) => handleSliderChange(val[0])}
                          max={200}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={parsePixelValue(value)}
                          onChange={(e) => handleInputChange(e.target.value)}
                          min={0}
                          max={200}
                          step={1}
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-xs text-muted-foreground w-6">px</span>
                      </div>
                    );
                  }}
                </ResponsiveStyleControl>
                
                <ResponsiveStyleControl
                  element={element}
                  property="paddingRight"
                  label="Right"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                >
                  {(value, onChange) => {
                    const parsePixelValue = (val: string | undefined): number => {
                      if (!val) return 0;
                      return parseInt(val.replace('px', '')) || 0;
                    };
                    
                    const handleSliderChange = (newValue: number) => {
                      onChange(`${newValue}px`);
                    };
                    
                    const handleInputChange = (inputValue: string) => {
                      const numValue = Math.max(0, Math.min(200, parseInt(inputValue) || 0));
                      onChange(`${numValue}px`);
                    };
                    
                    return (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-12">Right</Label>
                        <Slider
                          value={[parsePixelValue(value)]}
                          onValueChange={(val) => handleSliderChange(val[0])}
                          max={200}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={parsePixelValue(value)}
                          onChange={(e) => handleInputChange(e.target.value)}
                          min={0}
                          max={200}
                          step={1}
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-xs text-muted-foreground w-6">px</span>
                      </div>
                    );
                  }}
                </ResponsiveStyleControl>
                
                <ResponsiveStyleControl
                  element={element}
                  property="paddingBottom"
                  label="Bottom"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                >
                  {(value, onChange) => {
                    const parsePixelValue = (val: string | undefined): number => {
                      if (!val) return 0;
                      return parseInt(val.replace('px', '')) || 0;
                    };
                    
                    const handleSliderChange = (newValue: number) => {
                      onChange(`${newValue}px`);
                    };
                    
                    const handleInputChange = (inputValue: string) => {
                      const numValue = Math.max(0, Math.min(200, parseInt(inputValue) || 0));
                      onChange(`${numValue}px`);
                    };
                    
                    return (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-12">Bottom</Label>
                        <Slider
                          value={[parsePixelValue(value)]}
                          onValueChange={(val) => handleSliderChange(val[0])}
                          max={200}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={parsePixelValue(value)}
                          onChange={(e) => handleInputChange(e.target.value)}
                          min={0}
                          max={200}
                          step={1}
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-xs text-muted-foreground w-6">px</span>
                      </div>
                    );
                  }}
                </ResponsiveStyleControl>
                
                <ResponsiveStyleControl
                  element={element}
                  property="paddingLeft"
                  label="Left"
                  deviceType={responsiveTab}
                  fallback=""
                  onStyleUpdate={onStyleUpdate}
                >
                  {(value, onChange) => {
                    const parsePixelValue = (val: string | undefined): number => {
                      if (!val) return 0;
                      return parseInt(val.replace('px', '')) || 0;
                    };
                    
                    const handleSliderChange = (newValue: number) => {
                      onChange(`${newValue}px`);
                    };
                    
                    const handleInputChange = (inputValue: string) => {
                      const numValue = Math.max(0, Math.min(200, parseInt(inputValue) || 0));
                      onChange(`${numValue}px`);
                    };
                    
                    return (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-12">Left</Label>
                        <Slider
                          value={[parsePixelValue(value)]}
                          onValueChange={(val) => handleSliderChange(val[0])}
                          max={200}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={parsePixelValue(value)}
                          onChange={(e) => handleInputChange(e.target.value)}
                          min={0}
                          max={200}
                          step={1}
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-xs text-muted-foreground w-6">px</span>
                      </div>
                    );
                  }}
                </ResponsiveStyleControl>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};