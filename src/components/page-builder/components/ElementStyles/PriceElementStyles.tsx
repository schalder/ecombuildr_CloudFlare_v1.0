import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { ResponsiveControls } from '../ResponsiveControls';
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

// Convert device type for ResponsiveControls
const mapDeviceType = (device: 'desktop' | 'mobile'): 'desktop' | 'tablet' | 'mobile' => 
  device === 'mobile' ? 'mobile' : 'desktop';

// Typography group component
const TypographyGroup: React.FC<{
  label: string;
  styles: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
}> = ({ label, styles, onChange }) => (
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

  const handleDeviceChange = (newDevice: 'desktop' | 'tablet' | 'mobile') => {
    setDevice(newDevice === 'tablet' ? 'desktop' : newDevice);
  };

  return (
    <div className="space-y-6">
      {/* Typography Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Typography</Label>
          <ResponsiveControls
            deviceType={mapDeviceType(device)}
            onDeviceChange={handleDeviceChange}
            className="scale-90"
          />
        </div>
        
        <div className="space-y-3">
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
          />
        </div>
      </div>

      {/* Layout Section */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Layout</Label>
        
        <div>
          <Label className="text-xs">Layout Direction</Label>
          <Select
            value={(styles as any).layout || 'horizontal'}
            onValueChange={(value) => onStyleUpdate('layout', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal">Horizontal (Side by Side)</SelectItem>
              <SelectItem value="vertical">Vertical (Text Top, Button Bottom)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
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
          <Label className="text-xs">Price Elements Alignment</Label>
          <Select
            value={(styles as any).priceAlignment || 'left'}
            onValueChange={(value) => onStyleUpdate('priceAlignment', value)}
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

      {/* Button Section */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Button</Label>
        
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