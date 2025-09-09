import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { PageBuilderElement } from '../../../types';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleGroup } from '../_shared/CollapsibleGroup';
import { ResponsiveStyleControl, ResponsiveTabs } from '../_shared/ResponsiveStyleControl';
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';
import { useDevicePreview } from '../../../contexts/DevicePreviewContext';

interface EnhancedTextElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const EnhancedTextElementStyles: React.FC<EnhancedTextElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  // Use global device state instead of local state
  const { deviceType: responsiveTab, setDeviceType: setResponsiveTab } = useDevicePreview();
  
  // Collapsible state
  const [typographyOpen, setTypographyOpen] = React.useState(true);

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
      <CollapsibleGroup title="Typography" isOpen={typographyOpen} onToggle={setTypographyOpen}>
        <div className="space-y-4">
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
        </div>
      </CollapsibleGroup>
    </div>
  );
};