import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';

interface AccordionElementStylesProps {
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

export const AccordionElementStyles: React.FC<AccordionElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [isTitleTypographyOpen, setIsTitleTypographyOpen] = React.useState(true);
  const [isDescriptionTypographyOpen, setIsDescriptionTypographyOpen] = React.useState(true);
  
  const styles = element.styles || {};

  const getTitleStyles = () =>
    ensureResponsive((styles as any).titleStyles).responsive[device] || {};

  const getDescriptionStyles = () =>
    ensureResponsive((styles as any).descriptionStyles).responsive[device] || {};

  const updateTitleStyles = (patch: Record<string, any>) => {
    const base = ensureResponsive((styles as any).titleStyles);
    base.responsive[device] = { ...(base.responsive[device] || {}), ...patch };
    onStyleUpdate('titleStyles', base);
  };

  const updateDescriptionStyles = (patch: Record<string, any>) => {
    const base = ensureResponsive((styles as any).descriptionStyles);
    base.responsive[device] = { ...(base.responsive[device] || {}), ...patch };
    onStyleUpdate('descriptionStyles', base);
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

      {/* Title Typography Section */}
      <CollapsibleGroup
        title="Title Typography"
        isOpen={isTitleTypographyOpen}
        onToggle={setIsTitleTypographyOpen}
      >
        <TypographyGroup 
          label="Accordion Title Styling" 
          styles={getTitleStyles()} 
          onChange={updateTitleStyles} 
        />
      </CollapsibleGroup>

      {/* Description Typography Section */}
      <CollapsibleGroup
        title="Description Typography"
        isOpen={isDescriptionTypographyOpen}
        onToggle={setIsDescriptionTypographyOpen}
      >
        <TypographyGroup 
          label="Accordion Description Styling" 
          styles={getDescriptionStyles()} 
          onChange={updateDescriptionStyles} 
        />
      </CollapsibleGroup>
    </div>
  );
};

export default AccordionElementStyles;