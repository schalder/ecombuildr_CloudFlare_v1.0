import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilderElement } from '../../types';

interface PriceElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
  deviceType: 'desktop' | 'tablet' | 'mobile';
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

// Device toggle component
const DeviceToggle: React.FC<{
  value: 'desktop' | 'mobile';
  onChange: (device: 'desktop' | 'mobile') => void;
}> = ({ value, onChange }) => (
  <div className="flex rounded-lg border p-1 bg-muted">
    <button
      className={`px-3 py-1 text-xs rounded ${value === 'desktop' ? 'bg-background shadow-sm' : ''}`}
      onClick={() => onChange('desktop')}
    >
      Desktop
    </button>
    <button
      className={`px-3 py-1 text-xs rounded ${value === 'mobile' ? 'bg-background shadow-sm' : ''}`}
      onClick={() => onChange('mobile')}
    >
      Mobile
    </button>
  </div>
);

// Typography group component
const TypographyGroup: React.FC<{
  label: string;
  styles: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  showAlignment?: boolean;
}> = ({ label, styles, onChange, showAlignment = true }) => (
  <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
    <Label className="text-xs font-medium">{label}</Label>
    
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

    {showAlignment && (
      <div>
        <Label className="text-xs">Text Alignment</Label>
        <Select
          value={styles.textAlign || 'left'}
          onValueChange={(value) => onChange({ textAlign: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )}
  </div>
);

export const PriceElementStyles: React.FC<PriceElementStylesProps> = ({
  element,
  onStyleUpdate,
  deviceType,
}) => {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const styles = element.styles || {};

  const getGroup = (key: 'priceStyles' | 'comparePriceStyles' | 'discountStyles') =>
    ensureResponsive((styles as any)[key]).responsive[device] || {};

  const updateGroup = (key: 'priceStyles' | 'comparePriceStyles' | 'discountStyles', patch: Record<string, any>) => {
    const base = ensureResponsive((styles as any)[key]);
    base.responsive[device] = { ...(base.responsive[device] || {}), ...patch };
    onStyleUpdate(key, base);
  };

  return (
    <div className="space-y-4">
      {/* Typography Styles */}
      <div>
        <Label className="text-xs font-medium">Typography</Label>
        <div className="space-y-3">
          <DeviceToggle value={device} onChange={setDevice} />
          
          <TypographyGroup 
            label="Main Price" 
            styles={getGroup('priceStyles')} 
            onChange={(p) => updateGroup('priceStyles', p)} 
          />
          
          <TypographyGroup 
            label="Compare Price" 
            styles={getGroup('comparePriceStyles')} 
            onChange={(p) => updateGroup('comparePriceStyles', p)} 
          />
          
          <TypographyGroup 
            label="Discount Badge" 
            styles={getGroup('discountStyles')} 
            onChange={(p) => updateGroup('discountStyles', p)} 
            showAlignment={false}
          />
        </div>
      </div>

      {/* Layout Options */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Layout</Label>
        
        <div>
          <Label className="text-xs">Container Alignment</Label>
          <Select
            value={(styles as any).containerAlignment || 'left'}
            onValueChange={(value) => onStyleUpdate('containerAlignment', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs">Elements Spacing</Label>
          <div className="space-y-2">
            <Slider
              value={[parseInt((styles as any).spacing) || 8]}
              onValueChange={(value) => onStyleUpdate('spacing', `${value[0]}px`)}
              max={32}
              min={0}
              step={2}
            />
            <span className="text-xs text-muted-foreground">
              {parseInt((styles as any).spacing) || 8}px
            </span>
          </div>
        </div>
      </div>

      {/* Button Styles */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Button Styles</Label>
        
        <div>
          <Label className="text-xs">Button Style</Label>
          <Select
            value={(styles as any).buttonVariant || 'default'}
            onValueChange={(value) => onStyleUpdate('buttonVariant', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="ghost">Ghost</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(styles as any).buttonVariant === 'custom' && (
          <>
            <div>
              <Label className="text-xs">Button Background</Label>
              <ColorPicker
                color={(styles as any).buttonBackground || '#000000'}
                onChange={(color) => onStyleUpdate('buttonBackground', color)}
              />
            </div>
            <div>
              <Label className="text-xs">Button Text Color</Label>
              <ColorPicker
                color={(styles as any).buttonTextColor || '#ffffff'}
                onChange={(color) => onStyleUpdate('buttonTextColor', color)}
              />
            </div>
            <div>
              <Label className="text-xs">Button Hover Background</Label>
              <ColorPicker
                color={(styles as any).buttonHoverBackground || '#333333'}
                onChange={(color) => onStyleUpdate('buttonHoverBackground', color)}
              />
            </div>
          </>
        )}

        <div>
          <Label className="text-xs">Button Size</Label>
          <Select
            value={(styles as any).buttonSize || 'default'}
            onValueChange={(value) => onStyleUpdate('buttonSize', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Button Width</Label>
          <Select
            value={(styles as any).buttonWidth || 'auto'}
            onValueChange={(value) => onStyleUpdate('buttonWidth', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="full">Full Width</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};