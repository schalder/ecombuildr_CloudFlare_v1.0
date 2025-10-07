import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';
import { ResponsiveSpacingSliders } from './_shared/ResponsiveSpacingSliders';
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';

interface FAQElementStylesProps {
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

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
      <Label className="text-xs font-medium">{label}</Label>
      
      <div>
        <Label className="text-xs">Font Family</Label>
        <Select value={selectedFontValue} onValueChange={(v) => {
          const meta = (fontOptions as any[]).find((f: any) => f.value === v);
          if (meta && meta.family) ensureGoogleFontLoaded(meta.family, meta.weights);
          if (v === 'default') {
            onChange({ fontFamily: '' });
          } else {
            onChange({ fontFamily: v });
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
        <Label className="text-xs">Text Align</Label>
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant={styles.textAlign === 'left' ? 'default' : 'outline'}
            onClick={() => onChange({ textAlign: 'left' })}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={styles.textAlign === 'center' ? 'default' : 'outline'}
            onClick={() => onChange({ textAlign: 'center' })}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={styles.textAlign === 'right' ? 'default' : 'outline'}
            onClick={() => onChange({ textAlign: 'right' })}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const FAQElementStyles: React.FC<FAQElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [isQuestionTypographyOpen, setIsQuestionTypographyOpen] = React.useState(true);
  const [isAnswerTypographyOpen, setIsAnswerTypographyOpen] = React.useState(true);
  const [isHoverEffectsOpen, setIsHoverEffectsOpen] = React.useState(false);
  const [isBackgroundOpen, setIsBackgroundOpen] = React.useState(false);
  const [isBorderOpen, setIsBorderOpen] = React.useState(false);
  const [isSpacingOpen, setIsSpacingOpen] = React.useState(false);
  const [isGapOpen, setIsGapOpen] = React.useState(false);
  
  const styles = element.styles || {};

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

  const handleSpacingChange = (property: string, value: string) => {
    handleResponsiveUpdate(property, value);
  };

  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentStyles = (responsiveStyles as any)[device] || {};

  const getQuestionStyles = () =>
    ensureResponsive((styles as any).questionStyles).responsive[device] || {};

  const getAnswerStyles = () =>
    ensureResponsive((styles as any).answerStyles).responsive[device] || {};

  const updateQuestionStyles = (patch: Record<string, any>) => {
    const base = ensureResponsive((styles as any).questionStyles);
    base.responsive[device] = { ...(base.responsive[device] || {}), ...patch };
    onStyleUpdate('questionStyles', base);
  };

  const updateAnswerStyles = (patch: Record<string, any>) => {
    const base = ensureResponsive((styles as any).answerStyles);
    base.responsive[device] = { ...(base.responsive[device] || {}), ...patch };
    onStyleUpdate('answerStyles', base);
  };

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

      {/* Question Typography Section */}
      <CollapsibleGroup
        title="Question Typography"
        isOpen={isQuestionTypographyOpen}
        onToggle={setIsQuestionTypographyOpen}
      >
        <TypographyGroup 
          label="FAQ Question Styling" 
          styles={getQuestionStyles()} 
          onChange={updateQuestionStyles} 
        />
      </CollapsibleGroup>

      {/* Answer Typography Section */}
      <CollapsibleGroup
        title="Answer Typography"
        isOpen={isAnswerTypographyOpen}
        onToggle={setIsAnswerTypographyOpen}
      >
        <TypographyGroup 
          label="FAQ Answer Styling" 
          styles={getAnswerStyles()} 
          onChange={updateAnswerStyles} 
        />
      </CollapsibleGroup>

      {/* Hover Effects Section */}
      <CollapsibleGroup
        title="Hover Effects"
        isOpen={isHoverEffectsOpen}
        onToggle={setIsHoverEffectsOpen}
      >
        <div className="space-y-3">
          <ColorPicker 
            label="Question Hover Background"
            color={currentStyles.questionHoverBackground || ''}
            onChange={(val) => handleResponsiveUpdate('questionHoverBackground', val)}
          />
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

      {/* FAQ Gap Section */}
      <CollapsibleGroup
        title="FAQ Gap"
        isOpen={isGapOpen}
        onToggle={setIsGapOpen}
      >
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Gap Between FAQ Items</Label>
            <div className="space-y-1">
              <Slider
                value={[parseInt(currentStyles.faqGap) || 16]}
                onValueChange={(value) => handleResponsiveUpdate('faqGap', `${value[0]}px`)}
                max={100}
                min={0}
                step={1}
              />
              <span className="text-xs text-muted-foreground">{parseInt(currentStyles.faqGap) || 16}px</span>
            </div>
          </div>
        </div>
      </CollapsibleGroup>
    </div>
  );
};

export default FAQElementStyles;