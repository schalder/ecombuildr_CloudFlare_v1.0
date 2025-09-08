import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ResponsiveStyleControl, ResponsiveTabs } from './_shared/ResponsiveStyleControl';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';
import { useDevicePreview } from '../../contexts/DevicePreviewContext';
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface ImageFeatureElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const ImageFeatureElementStyles: React.FC<ImageFeatureElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  // Use global device state instead of local state
  const { deviceType, setDeviceType } = useDevicePreview();
  
  // Collapsible state
  const [headlineOpen, setHeadlineOpen] = React.useState(true);
  const [descriptionOpen, setDescriptionOpen] = React.useState(false);
  const [backgroundOpen, setBackgroundOpen] = React.useState(false);
  const [borderOpen, setBorderOpen] = React.useState(false);
  const [spacingOpen, setSpacingOpen] = React.useState(false);


  const fontOptions = React.useMemo(() => [
    { label: 'Default', value: '' },
    { label: 'System Sans', value: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"' },
    { label: 'Serif', value: 'Georgia, Times New Roman, Times, serif' },
    { label: 'Monospace', value: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
    { label: 'Poppins', value: '"Poppins", sans-serif', family: 'Poppins', weights: '400;500;600;700' },
    { label: 'Montserrat', value: '"Montserrat", sans-serif', family: 'Montserrat', weights: '400;500;600;700' },
    { label: 'Roboto', value: 'Roboto, sans-serif', family: 'Roboto', weights: '400;500;700' },
    { label: 'Open Sans', value: '"Open Sans", sans-serif', family: 'Open Sans', weights: '400;600;700' },
    { label: 'Lato', value: 'Lato, sans-serif', family: 'Lato', weights: '400;700' },
    { label: 'Playfair Display', value: '"Playfair Display", serif', family: 'Playfair Display', weights: '400;700' },
  ], []);

  const TypographyGroup = ({ 
    element, 
    property, 
    deviceType, 
    onStyleUpdate 
  }: {
    element: PageBuilderElement;
    property: string;
    deviceType: 'desktop' | 'tablet' | 'mobile';
    onStyleUpdate: (property: string, value: any) => void;
  }) => {
    return (
      <>
        <ResponsiveStyleControl
          element={element}
          property={`${property}FontFamily`}
          label="Font Family"
          deviceType={deviceType}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Select 
              value={fontOptions.find(f => f.value === value)?.value || 'default'}
              onValueChange={(v) => {
                const meta = fontOptions.find(f => f.value === v);
                if (meta && (meta as any).family) ensureGoogleFontLoaded((meta as any).family, (meta as any).weights);
                onChange(v === 'default' ? '' : v);
              }}
            >
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
          property={`${property}FontSize`}
          label="Font Size"
          deviceType={deviceType}
          fallback={property === 'headline' ? '24px' : '16px'}
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
          property={`${property}TextAlign`}
          label="Text Align"
          deviceType={deviceType}
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
          property={`${property}LineHeight`}
          label="Line Height"
          deviceType={deviceType}
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

        <ResponsiveStyleControl
          element={element}
          property={`${property}Color`}
          label="Text Color"
          deviceType={deviceType}
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
      </>
    );
  };

  return (
    <div className="space-y-4">
      {/* Device Toggle */}
      <ResponsiveTabs activeTab={deviceType} onTabChange={setDeviceType} />

      {/* Headline Typography */}
      <Collapsible open={headlineOpen} onOpenChange={setHeadlineOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Headline Typography</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${headlineOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <TypographyGroup
            element={element}
            property="headline"
            deviceType={deviceType}
            onStyleUpdate={onStyleUpdate}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Description Typography */}
      <Collapsible open={descriptionOpen} onOpenChange={setDescriptionOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description Typography</h4>
          <ChevronDown className={`h-4 w-4 transition-transform ${descriptionOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <TypographyGroup
            element={element}
            property="description"
            deviceType={deviceType}
            onStyleUpdate={onStyleUpdate}
          />
        </CollapsibleContent>
      </Collapsible>

      <CollapsibleGroup title="Background" isOpen={backgroundOpen} onToggle={setBackgroundOpen}>
        <ResponsiveStyleControl
          element={element}
          property="backgroundColor"
          label="Background Color"
          deviceType={deviceType}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker color={value || ''} onChange={onChange} />
          )}
        </ResponsiveStyleControl>
      </CollapsibleGroup>

      <CollapsibleGroup title="Border" isOpen={borderOpen} onToggle={setBorderOpen}>
        <ResponsiveStyleControl
          element={element}
          property="borderWidth"
          label="Border Width"
          deviceType={deviceType}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., 1px"
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="borderColor"
          label="Border Color"
          deviceType={deviceType}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker color={value || ''} onChange={onChange} />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="borderRadius"
          label="Border Radius"
          deviceType={deviceType}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., 8px"
            />
          )}
        </ResponsiveStyleControl>
      </CollapsibleGroup>

      <CollapsibleGroup title="Spacing" isOpen={spacingOpen} onToggle={setSpacingOpen}>
        <SpacingSliders
          marginTop={element.styles?.marginTop}
          marginRight={element.styles?.marginRight}
          marginBottom={element.styles?.marginBottom}
          marginLeft={element.styles?.marginLeft}
          paddingTop={element.styles?.paddingTop}
          paddingRight={element.styles?.paddingRight}
          paddingBottom={element.styles?.paddingBottom}
          paddingLeft={element.styles?.paddingLeft}
          onMarginChange={(property, value) => onStyleUpdate(property, value)}
          onPaddingChange={(property, value) => onStyleUpdate(property, value)}
        />
      </CollapsibleGroup>
    </div>
  );
};