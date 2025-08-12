import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';

interface MediaElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const MediaElementStyles: React.FC<MediaElementStylesProps> = ({
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
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dimensions</h4>

        {/* Device toggle for responsive width */}
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

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Width</Label>
            <Input
              value={(currentStyles.width || element.styles?.width || '') as string}
              onChange={(e) => handleResponsiveUpdate('width', e.target.value)}
              placeholder="e.g., 100%, 75%, 50%, auto"
            />
          </div>
          <div>
            <Label className="text-xs">Height</Label>
            <Input
              value={element.styles?.height || ''}
              onChange={(e) => onStyleUpdate('height', e.target.value)}
              placeholder="auto"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Max Width</Label>
          <Input
            value={element.styles?.maxWidth || ''}
            onChange={(e) => onStyleUpdate('maxWidth', e.target.value)}
            placeholder="100%"
          />
        </div>

        {element.type === 'image' && (
          <div>
            <Label className="text-xs">Object Fit</Label>
            <Select
              value={element.styles?.objectFit || 'cover'}
              onValueChange={(value) => onStyleUpdate('objectFit', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="fill">Fill</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="scale-down">Scale Down</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      {/* Background */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Background</h4>
        
        <div>
          <Label className="text-xs">Background Color</Label>
          <Input
            type="color"
            value={element.styles?.backgroundColor || '#ffffff'}
            onChange={(e) => onStyleUpdate('backgroundColor', e.target.value)}
            className="w-full h-10"
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

        <div>
          <Label className="text-xs">Border Color</Label>
          <Input
            type="color"
            value={element.styles?.borderColor || '#e5e7eb'}
            onChange={(e) => onStyleUpdate('borderColor', e.target.value)}
            className="w-full h-10"
          />
        </div>

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
            placeholder="e.g., 0 4px 8px rgba(0,0,0,0.1)"
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
                onChange={(e) => handleResponsiveUpdate('paddingTop', e.target.value || '10px')}
                placeholder="10px"
              />
            </div>
            <div>
              <Label className="text-2xs text-muted-foreground">Right</Label>
              <Input
                value={(currentStyles.paddingRight || element.styles?.paddingRight || '') as string}
                onChange={(e) => handleResponsiveUpdate('paddingRight', e.target.value || '10px')}
                placeholder="10px"
              />
            </div>
            <div>
              <Label className="text-2xs text-muted-foreground">Bottom</Label>
              <Input
                value={(currentStyles.paddingBottom || element.styles?.paddingBottom || '') as string}
                onChange={(e) => handleResponsiveUpdate('paddingBottom', e.target.value || '10px')}
                placeholder="10px"
              />
            </div>
            <div>
              <Label className="text-2xs text-muted-foreground">Left</Label>
              <Input
                value={(currentStyles.paddingLeft || element.styles?.paddingLeft || '') as string}
                onChange={(e) => handleResponsiveUpdate('paddingLeft', e.target.value || '10px')}
                placeholder="10px"
              />
            </div>
          </div>
        </div>
      </div>