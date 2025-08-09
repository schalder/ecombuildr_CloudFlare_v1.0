import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { ColorPicker } from '@/components/ui/color-picker';
interface TextElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const TextElementStyles: React.FC<TextElementStylesProps> = ({
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
  return (
    <div className="space-y-4">
      {/* Typography */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Typography</h4>
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
          <Label className="text-xs">Font Size</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(((currentStyles.fontSize || element.styles?.fontSize || '16px').toString()).replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('fontSize', `${value[0]}px`)}
              max={72}
              min={8}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {(currentStyles.fontSize || element.styles?.fontSize || '16px') as string}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Text Align</Label>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant={element.styles?.textAlign === 'left' ? 'default' : 'outline'}
              onClick={() => onStyleUpdate('textAlign', 'left')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={element.styles?.textAlign === 'center' ? 'default' : 'outline'}
              onClick={() => onStyleUpdate('textAlign', 'center')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={element.styles?.textAlign === 'right' ? 'default' : 'outline'}
              onClick={() => onStyleUpdate('textAlign', 'right')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs">Line Height</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseFloat(((currentStyles.lineHeight ?? element.styles?.lineHeight ?? '1.6').toString()))]}
              onValueChange={(value) => handleResponsiveUpdate('lineHeight', value[0].toString())}
              max={3}
              min={1}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {(currentStyles.lineHeight || element.styles?.lineHeight || '1.6') as string}
            </span>
          </div>
        </div>

          <ColorPicker 
            label="Text Color"
            color={element.styles?.color || ''}
            onChange={(val) => onStyleUpdate('color', val)}
          />
      </div>

      <Separator />

      {/* Background */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Background</h4>
        
        <ColorPicker 
          label="Background Color"
          color={element.styles?.backgroundColor || ''}
          onChange={(val) => onStyleUpdate('backgroundColor', val)}
        />
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
          onChange={(val) => onStyleUpdate('borderColor', val)}
        />

        <div>
          <Label className="text-xs">Border Radius</Label>
          <Input
            value={element.styles?.borderRadius || ''}
            onChange={(e) => onStyleUpdate('borderRadius', e.target.value)}
            placeholder="e.g., 4px"
          />
        </div>
      </div>

      <Separator />

      {/* Spacing */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</h4>
        
        <div>
          <Label className="text-xs">Margin</Label>
          <Input
            value={(currentStyles.margin || element.styles?.margin || '') as string}
            onChange={(e) => handleResponsiveUpdate('margin', e.target.value)}
            placeholder="e.g., 10px 20px"
          />
        </div>

        <div>
          <Label className="text-xs">Padding</Label>
          <Input
            value={(currentStyles.padding || element.styles?.padding || '') as string}
            onChange={(e) => handleResponsiveUpdate('padding', e.target.value)}
            placeholder="e.g., 10px 20px"
          />
        </div>
      </div>

      {/* Ecommerce-specific: Button Styles */}
      {['product-grid', 'featured-products'].includes(element.type) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Button Styles</h4>
            <ColorPicker 
              label="Text Color"
              color={(element.styles as any)?.buttonStyles?.color || ''}
              onChange={(val) => onStyleUpdate('buttonStyles', { ...(element.styles as any)?.buttonStyles, color: val })}
            />
            <ColorPicker 
              label="Background Color"
              color={(element.styles as any)?.buttonStyles?.backgroundColor || ''}
              onChange={(val) => onStyleUpdate('buttonStyles', { ...(element.styles as any)?.buttonStyles, backgroundColor: val })}
            />
          </div>
        </>
      )}
    </div>
  );
};