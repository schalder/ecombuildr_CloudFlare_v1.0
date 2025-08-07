import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';

interface ButtonElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const ButtonElementStyles: React.FC<ButtonElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  console.log('🔥 ButtonElementStyles LOADED for:', element.type, element.id);
  
  const desktopStyles = element.styles?.responsive?.desktop || {};
  const mobileStyles = element.styles?.responsive?.mobile || {};

  const updateResponsiveStyle = (device: 'desktop' | 'mobile', property: string, value: any) => {
    const currentResponsive = element.styles?.responsive || {};
    const currentDevice = currentResponsive[device] || {};
    
    onStyleUpdate('responsive', {
      ...currentResponsive,
      [device]: {
        ...currentDevice,
        [property]: value
      }
    });
  };

  const updateFullWidth = (fullWidth: boolean) => {
    onStyleUpdate('responsive', {
      ...(element.styles?.responsive || {}),
      fullWidth
    });
  };

  return (
    <div className="space-y-6">
      {/* WIDTH CONTROLS */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Width Controls</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="full-width" className="text-sm">Full Width</Label>
          <Switch
            id="full-width"
            checked={element.styles?.responsive?.fullWidth || false}
            onCheckedChange={updateFullWidth}
          />
        </div>

        {!element.styles?.responsive?.fullWidth && (
          <div className="space-y-2">
            <Label className="text-sm">Custom Width</Label>
            <Input
              type="text"
              placeholder="e.g., 200px, 50%, auto"
              value={(element.styles?.responsive as any)?.customWidth || ''}
              onChange={(e) => {
                const currentResponsive = element.styles?.responsive || {};
                onStyleUpdate('responsive', {
                  ...currentResponsive,
                  customWidth: e.target.value
                });
              }}
            />
          </div>
        )}
      </div>

      <Separator />

      {/* RESPONSIVE TYPOGRAPHY */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Responsive Typography</h4>
        
        <Tabs defaultValue="desktop" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop" className="flex items-center gap-1">
              <Monitor className="w-3 h-3" />
              Desktop
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              Mobile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="desktop" className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label className="text-sm">Font Size</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[Number(desktopStyles.fontSize) || 16]}
                  onValueChange={([value]) => updateResponsiveStyle('desktop', 'fontSize', value)}
                  min={8}
                  max={48}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {desktopStyles.fontSize || 16}px
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Font Weight</Label>
              <Select
                value={desktopStyles.fontWeight || 'normal'}
                onValueChange={(value) => updateResponsiveStyle('desktop', 'fontWeight', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="semibold">Semibold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label className="text-sm">Font Size</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[Number(mobileStyles.fontSize) || 14]}
                  onValueChange={([value]) => updateResponsiveStyle('mobile', 'fontSize', value)}
                  min={8}
                  max={32}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {mobileStyles.fontSize || 14}px
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Font Weight</Label>
              <Select
                value={mobileStyles.fontWeight || 'normal'}
                onValueChange={(value) => updateResponsiveStyle('mobile', 'fontWeight', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="semibold">Semibold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* COLORS */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Colors</h4>
        
        <div className="space-y-2">
          <Label className="text-sm">Text Color</Label>
          <Input
            type="color"
            value={element.content.textColor || '#ffffff'}
            onChange={(e) => onStyleUpdate('content', { ...element.content, textColor: e.target.value })}
            className="w-full h-10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Background Color</Label>
          <Input
            type="color"
            value={element.content.backgroundColor || '#007bff'}
            onChange={(e) => onStyleUpdate('content', { ...element.content, backgroundColor: e.target.value })}
            className="w-full h-10"
          />
        </div>
      </div>

      <Separator />

      {/* BORDERS & EFFECTS */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Borders & Effects</h4>
        
        <div className="space-y-2">
          <Label className="text-sm">Border Radius</Label>
          <Input
            type="text"
            placeholder="e.g., 4px, 8px, 50%"
            value={element.content.borderRadius || ''}
            onChange={(e) => onStyleUpdate('content', { ...element.content, borderRadius: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Box Shadow</Label>
          <Input
            type="text"
            placeholder="e.g., 0 2px 4px rgba(0,0,0,0.1)"
            value={element.content.boxShadow || ''}
            onChange={(e) => onStyleUpdate('content', { ...element.content, boxShadow: e.target.value })}
          />
        </div>
      </div>

      <Separator />

      {/* SMART PADDING */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Smart Padding</h4>
        
        <div className="space-y-2">
          <Label className="text-sm">Padding</Label>
          <Input
            type="text"
            placeholder="e.g., 12px 24px, auto"
            value={(element.styles?.responsive as any)?.padding || 'auto'}
            onChange={(e) => {
              const currentResponsive = element.styles?.responsive || {};
              onStyleUpdate('responsive', {
                ...currentResponsive,
                padding: e.target.value
              });
            }}
          />
          <p className="text-xs text-muted-foreground">
            Use "auto" for smart padding based on font size, or specify custom values
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Margin</Label>
          <Input
            type="text"
            placeholder="e.g., 10px 0, auto"
            value={element.content.margin || ''}
            onChange={(e) => onStyleUpdate('content', { ...element.content, margin: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};