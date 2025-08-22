import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';

interface HeroSliderElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const HeroSliderElementStyles: React.FC<HeroSliderElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  // Responsive controls (desktop/mobile)
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

  return (
    <div className="space-y-4">
      {/* Dimensions */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dimensions</h4>

        {/* Device toggle for responsive settings */}
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

        <div>
          <Label className="text-xs">Height</Label>
          <Input
            value={(currentStyles.minHeight || element.styles?.minHeight || '') as string}
            onChange={(e) => handleResponsiveUpdate('minHeight', e.target.value)}
            placeholder="e.g., 500px, 60vh, 100vh"
          />
        </div>

        <div>
          <Label className="text-xs">Max Width</Label>
          <Input
            value={element.styles?.maxWidth || ''}
            onChange={(e) => onStyleUpdate('maxWidth', e.target.value)}
            placeholder="100%"
          />
        </div>
      </div>

      <Separator />

      {/* Background */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Background</h4>
        
        <ColorPicker
          label="Background Color"
          color={element.styles?.backgroundColor || ''}
          onChange={(color) => onStyleUpdate('backgroundColor', color)}
        />

        <div>
          <Label className="text-xs">Background Image</Label>
          <Input
            value={element.styles?.backgroundImage || ''}
            onChange={(e) => onStyleUpdate('backgroundImage', e.target.value)}
            placeholder="url() or gradient"
          />
        </div>

        <div>
          <Label className="text-xs">Background Size</Label>
          <Input
            value={(element.styles as any)?.backgroundSize || ''}
            onChange={(e) => onStyleUpdate('backgroundSize', e.target.value)}
            placeholder="cover, contain, auto"
          />
        </div>

        <div>
          <Label className="text-xs">Background Position</Label>
          <Input
            value={(element.styles as any)?.backgroundPosition || ''}
            onChange={(e) => onStyleUpdate('backgroundPosition', e.target.value)}
            placeholder="center, top, bottom"
          />
        </div>
      </div>

      <Separator />

      {/* Border */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Border</h4>
        
        <div>
          <Label className="text-xs">Border Width</Label>
          <Input
            value={element.styles?.borderWidth || ''}
            onChange={(e) => onStyleUpdate('borderWidth', e.target.value)}
            placeholder="e.g., 1px"
          />
        </div>

        <ColorPicker
          label="Border Color"
          color={element.styles?.borderColor || ''}
          onChange={(color) => onStyleUpdate('borderColor', color)}
        />

        <div>
          <Label className="text-xs">Border Radius</Label>
          <Input
            value={element.styles?.borderRadius || ''}
            onChange={(e) => onStyleUpdate('borderRadius', e.target.value)}
            placeholder="e.g., 8px"
          />
        </div>
      </div>

      <Separator />

      {/* Effects */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Effects</h4>
        
        <div>
          <Label className="text-xs">Opacity</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseFloat(element.styles?.opacity?.toString() || '1')]}
              onValueChange={(value) => onStyleUpdate('opacity', value[0].toString())}
              max={1}
              min={0}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {element.styles?.opacity || '1'}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Box Shadow</Label>
          <Input
            value={element.styles?.boxShadow || ''}
            onChange={(e) => onStyleUpdate('boxShadow', e.target.value)}
            placeholder="e.g., 0 4px 20px rgba(0,0,0,0.1)"
          />
        </div>

        <div>
          <Label className="text-xs">Transform</Label>
          <Input
            value={(element.styles as any)?.transform || ''}
            onChange={(e) => onStyleUpdate('transform', e.target.value)}
            placeholder="e.g., scale(1.05), rotate(5deg)"
          />
        </div>
      </div>

      <Separator />

      {/* Spacing */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</h4>

        {/* Margin per-side (responsive) */}
        <div>
          <Label className="text-xs">Margin</Label>
          <div className="grid grid-cols-4 gap-2 mt-1">
            <div>
              <Label className="text-2xs text-muted-foreground">Top</Label>
              <Input
                value={(currentStyles.marginTop || element.styles?.marginTop || '') as string}
                onChange={(e) => handleResponsiveUpdate('marginTop', e.target.value || '0px')}
                placeholder="0px"
              />
            </div>
            <div>
              <Label className="text-2xs text-muted-foreground">Right</Label>
              <Input
                value={(currentStyles.marginRight || element.styles?.marginRight || '') as string}
                onChange={(e) => handleResponsiveUpdate('marginRight', e.target.value || '0px')}
                placeholder="0px"
              />
            </div>
            <div>
              <Label className="text-2xs text-muted-foreground">Bottom</Label>
              <Input
                value={(currentStyles.marginBottom || element.styles?.marginBottom || '') as string}
                onChange={(e) => handleResponsiveUpdate('marginBottom', e.target.value || '0px')}
                placeholder="0px"
              />
            </div>
            <div>
              <Label className="text-2xs text-muted-foreground">Left</Label>
              <Input
                value={(currentStyles.marginLeft || element.styles?.marginLeft || '') as string}
                onChange={(e) => handleResponsiveUpdate('marginLeft', e.target.value || '0px')}
                placeholder="0px"
              />
            </div>
          </div>
        </div>

        {/* Padding per-side (responsive) */}
        <div>
          <Label className="text-xs">Padding</Label>
          <div className="grid grid-cols-4 gap-2 mt-1">
            <div>
              <Label className="text-2xs text-muted-foreground">Top</Label>
              <Input
                value={(currentStyles.paddingTop || element.styles?.paddingTop || '') as string}
                onChange={(e) => handleResponsiveUpdate('paddingTop', e.target.value || '20px')}
                placeholder="20px"
              />
            </div>
            <div>
              <Label className="text-2xs text-muted-foreground">Right</Label>
              <Input
                value={(currentStyles.paddingRight || element.styles?.paddingRight || '') as string}
                onChange={(e) => handleResponsiveUpdate('paddingRight', e.target.value || '20px')}
                placeholder="20px"
              />
            </div>
            <div>
              <Label className="text-2xs text-muted-foreground">Bottom</Label>
              <Input
                value={(currentStyles.paddingBottom || element.styles?.paddingBottom || '') as string}
                onChange={(e) => handleResponsiveUpdate('paddingBottom', e.target.value || '20px')}
                placeholder="20px"
              />
            </div>
            <div>
              <Label className="text-2xs text-muted-foreground">Left</Label>
              <Input
                value={(currentStyles.paddingLeft || element.styles?.paddingLeft || '') as string}
                onChange={(e) => handleResponsiveUpdate('paddingLeft', e.target.value || '20px')}
                placeholder="20px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};