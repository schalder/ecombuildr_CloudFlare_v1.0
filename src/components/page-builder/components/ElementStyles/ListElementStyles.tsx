import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';

interface ListElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const ListElementStyles: React.FC<ListElementStylesProps> = ({ element, onStyleUpdate }) => {
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
      <Separator />
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">List Styles</h4>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Device</Label>
          <div className="flex space-x-2">
            <Button size="sm" variant={responsiveTab === 'desktop' ? 'default' : 'outline'} onClick={() => setResponsiveTab('desktop')}>
              <Monitor className="h-4 w-4 mr-1" /> Desktop
            </Button>
            <Button size="sm" variant={responsiveTab === 'mobile' ? 'default' : 'outline'} onClick={() => setResponsiveTab('mobile')}>
              <Smartphone className="h-4 w-4 mr-1" /> Mobile
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs">Icon Size</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(((currentStyles.iconSize || (element.styles as any)?.iconSize || '16').toString()).replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('iconSize', value[0])}
              max={64}
              min={8}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">{(currentStyles.iconSize || (element.styles as any)?.iconSize || 16) as number}px</span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Item Gap</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(((currentStyles.itemGap || (element.styles as any)?.itemGap || '4').toString()).replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('itemGap', value[0])}
              max={24}
              min={0}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">{(currentStyles.itemGap || (element.styles as any)?.itemGap || 4) as number}px</span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Indent</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(((currentStyles.indent || (element.styles as any)?.indent || '0').toString()).replace(/\D/g, ''))]}
              onValueChange={(value) => handleResponsiveUpdate('indent', value[0])}
              max={48}
              min={0}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">{(currentStyles.indent || (element.styles as any)?.indent || 0) as number}px</span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Icon Color</Label>
          <ColorPicker
            color={(currentStyles.iconColor || (element.styles as any)?.iconColor || '') as string}
            onChange={(val) => handleResponsiveUpdate('iconColor', val)}
          />
        </div>
      </div>
    </div>
  );
};
