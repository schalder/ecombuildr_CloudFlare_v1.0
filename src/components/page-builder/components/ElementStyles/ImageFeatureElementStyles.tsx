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

interface ImageFeatureElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const ImageFeatureElementStyles: React.FC<ImageFeatureElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  const { deviceType, setDeviceType } = useDevicePreview();
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

  const TypographyGroup = ({ title, prefix, defaultFontSize = '16px', isOpen, onToggle }: {
    title: string;
    prefix: string;
    defaultFontSize?: string;
    isOpen: boolean;
    onToggle: () => void;
  }) => {
    const fontFamilyProperty = `${prefix}FontFamily`;
    const fontSizeProperty = `${prefix}FontSize`;
    const textAlignProperty = `${prefix}TextAlign`;
    const lineHeightProperty = `${prefix}LineHeight`;
    const colorProperty = `${prefix}Color`;

    return (
      <CollapsibleGroup 
        title={title} 
        isOpen={isOpen} 
        onToggle={onToggle}
      >
        <ResponsiveStyleControl
          element={element}
          property={fontFamilyProperty}
          label="Font Family"
          deviceType={deviceType}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Select 
              value={value || 'default'} 
              onValueChange={(v) => {
                const option = fontOptions.find(f => f.value === v);
                if (option && 'family' in option) {
                  ensureGoogleFontLoaded(option.family, option.weights);
                }
                onChange(v === 'default' ? '' : v);
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                {fontOptions.slice(1).map((option) => (
                  <SelectItem key={option.label} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property={fontSizeProperty}
          label="Font Size"
          deviceType={deviceType}
          fallback={defaultFontSize}
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => {
            const numericValue = parseInt(value?.toString().replace(/\D/g, '') || defaultFontSize.replace(/\D/g, ''));
            return (
              <div className="flex items-center space-x-2">
                <Slider
                  value={[numericValue]}
                  onValueChange={(vals) => onChange(`${vals[0]}px`)}
                  max={72}
                  min={8}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {numericValue}px
                </span>
              </div>
            );
          }}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property={textAlignProperty}
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
          property={lineHeightProperty}
          label="Line Height"
          deviceType={deviceType}
          fallback="1.6"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => {
            const numericValue = parseFloat(value?.toString() || '1.6');
            return (
              <div className="flex items-center space-x-2">
                <Slider
                  value={[numericValue]}
                  onValueChange={(vals) => onChange(vals[0].toString())}
                  max={3}
                  min={1}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {numericValue.toFixed(1)}
                </span>
              </div>
            );
          }}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property={colorProperty}
          label="Text Color"
          deviceType={deviceType}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker
              color={value || ''}
              onChange={onChange}
            />
          )}
        </ResponsiveStyleControl>
      </CollapsibleGroup>
    );
  };

  return (
    <div className="space-y-4">
      <ResponsiveTabs activeTab={deviceType} onTabChange={setDeviceType} />

      <TypographyGroup
        title="Headline Typography"
        prefix="headline"
        defaultFontSize="24px"
        isOpen={headlineOpen}
        onToggle={() => setHeadlineOpen(!headlineOpen)}
      />

      <TypographyGroup
        title="Description Typography"
        prefix="description"
        defaultFontSize="16px"
        isOpen={descriptionOpen}
        onToggle={() => setDescriptionOpen(!descriptionOpen)}
      />

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