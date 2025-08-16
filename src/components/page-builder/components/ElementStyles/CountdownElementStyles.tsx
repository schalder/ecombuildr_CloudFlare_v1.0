import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Monitor, Smartphone, Palette } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CountdownElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const CountdownElementStyles: React.FC<CountdownElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  // Responsive controls state and helpers
  const [responsiveTab, setResponsiveTab] = React.useState<'desktop' | 'mobile'>('desktop');
  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentStyles = (responsiveStyles as any)[responsiveTab] || {};

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

  const applyPreset = (presetName: string) => {
    const presets = {
      'bold-boxes': {
        desktop: {
          numberColor: '#ffffff',
          numberBackgroundColor: 'hsl(var(--primary))',
          labelColor: 'hsl(var(--foreground))',
          numberFontSize: '32px',
          labelFontSize: '14px',
          segmentPadding: '16px',
          segmentBorderRadius: '12px',
          segmentBorderWidth: '0px',
          segmentGap: '16px'
        },
        mobile: {
          numberFontSize: '24px',
          segmentPadding: '12px',
          segmentGap: '12px'
        }
      },
      'outline-pills': {
        desktop: {
          numberColor: 'hsl(var(--primary))',
          numberBackgroundColor: 'transparent',
          labelColor: 'hsl(var(--muted-foreground))',
          numberFontSize: '28px',
          labelFontSize: '12px',
          segmentPadding: '12px 20px',
          segmentBorderRadius: '24px',
          segmentBorderWidth: '2px',
          segmentBorderColor: 'hsl(var(--primary))',
          segmentGap: '16px'
        },
        mobile: {
          numberFontSize: '20px',
          segmentPadding: '8px 16px',
          segmentGap: '12px'
        }
      },
      'minimal-inline': {
        desktop: {
          numberColor: 'hsl(var(--foreground))',
          numberBackgroundColor: 'transparent',
          labelColor: 'hsl(var(--muted-foreground))',
          numberFontSize: '24px',
          labelFontSize: '12px',
          segmentPadding: '4px 8px',
          segmentBorderRadius: '4px',
          segmentBorderWidth: '0px',
          segmentGap: '8px'
        },
        mobile: {
          numberFontSize: '18px',
          segmentGap: '6px'
        }
      },
      'gradient-modern': {
        desktop: {
          numberColor: '#ffffff',
          numberBackgroundColor: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
          labelColor: 'hsl(var(--foreground))',
          numberFontSize: '30px',
          labelFontSize: '13px',
          segmentPadding: '16px',
          segmentBorderRadius: '8px',
          segmentBorderWidth: '0px',
          segmentGap: '20px'
        },
        mobile: {
          numberFontSize: '22px',
          segmentPadding: '12px',
          segmentGap: '14px'
        }
      }
    };

    const preset = presets[presetName as keyof typeof presets];
    if (preset) {
      onStyleUpdate('responsive', preset);
    }
  };

  return (
    <div className="space-y-4">
      {/* Responsive Controls */}
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

      {/* Style Presets */}
      <div className="space-y-2">
        <Label className="text-xs">Style Presets</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPreset('bold-boxes')}
          >
            <Palette className="h-3 w-3 mr-1" />
            Bold Boxes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPreset('outline-pills')}
          >
            <Palette className="h-3 w-3 mr-1" />
            Outline Pills
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPreset('minimal-inline')}
          >
            <Palette className="h-3 w-3 mr-1" />
            Minimal Inline
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPreset('gradient-modern')}
          >
            <Palette className="h-3 w-3 mr-1" />
            Gradient Modern
          </Button>
        </div>
      </div>

      <Separator />

      {/* Number Styles */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Number Styles</h4>
        
        <div>
          <Label className="text-xs">Font Size</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(((currentStyles.numberFontSize || '24px').toString()).replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('numberFontSize', `${value[0]}px`)}
              max={72}
              min={12}
              step={2}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {(currentStyles.numberFontSize || '24px') as string}
            </span>
          </div>
        </div>

        <ColorPicker 
          label="Number Color"
          color={(currentStyles.numberColor || '') as string}
          onChange={(val) => handleResponsiveUpdate('numberColor', val)}
        />

        <ColorPicker 
          label="Number Background"
          color={(currentStyles.numberBackgroundColor || '') as string}
          onChange={(val) => handleResponsiveUpdate('numberBackgroundColor', val)}
        />
      </div>

      <Separator />

      {/* Label Styles */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Label Styles</h4>
        
        <div>
          <Label className="text-xs">Font Size</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(((currentStyles.labelFontSize || '12px').toString()).replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('labelFontSize', `${value[0]}px`)}
              max={24}
              min={8}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {(currentStyles.labelFontSize || '12px') as string}
            </span>
          </div>
        </div>

        <ColorPicker 
          label="Label Color"
          color={(currentStyles.labelColor || '') as string}
          onChange={(val) => handleResponsiveUpdate('labelColor', val)}
        />
      </div>

      <Separator />

      {/* Segment Styles */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Segment Styles</h4>
        
        <div>
          <Label className="text-xs">Padding</Label>
          <Select
            value={(currentStyles.segmentPadding || '12px') as string}
            onValueChange={(value) => handleResponsiveUpdate('segmentPadding', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4px 8px">Small (4px 8px)</SelectItem>
              <SelectItem value="8px 12px">Medium (8px 12px)</SelectItem>
              <SelectItem value="12px">Default (12px)</SelectItem>
              <SelectItem value="16px">Large (16px)</SelectItem>
              <SelectItem value="8px 20px">Pill (8px 20px)</SelectItem>
              <SelectItem value="12px 20px">Wide Pill (12px 20px)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Border Radius</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(((currentStyles.segmentBorderRadius || '8px').toString()).replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('segmentBorderRadius', `${value[0]}px`)}
              max={50}
              min={0}
              step={2}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {(currentStyles.segmentBorderRadius || '8px') as string}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Border Width</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(((currentStyles.segmentBorderWidth || '0px').toString()).replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('segmentBorderWidth', `${value[0]}px`)}
              max={5}
              min={0}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {(currentStyles.segmentBorderWidth || '0px') as string}
            </span>
          </div>
        </div>

        <ColorPicker 
          label="Border Color"
          color={(currentStyles.segmentBorderColor || '') as string}
          onChange={(val) => handleResponsiveUpdate('segmentBorderColor', val)}
        />

        <div>
          <Label className="text-xs">Gap Between Segments</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(((currentStyles.segmentGap || '16px').toString()).replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('segmentGap', `${value[0]}px`)}
              max={40}
              min={4}
              step={2}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {(currentStyles.segmentGap || '16px') as string}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};