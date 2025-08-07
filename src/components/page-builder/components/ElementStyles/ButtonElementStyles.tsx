import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';

interface ButtonElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const ButtonElementStyles: React.FC<ButtonElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
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

  return (
    <div className="space-y-4">
      {/* Width Controls */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Width</h4>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="full-width"
            checked={element.styles?.responsive?.fullWidth || element.content.fullWidth || false}
            onCheckedChange={(checked) => {
              const currentResponsive = element.styles?.responsive || {};
              onStyleUpdate('responsive', {
                ...currentResponsive,
                fullWidth: checked
              });
            }}
          />
          <Label htmlFor="full-width" className="text-xs">Full Width</Label>
        </div>

        {!(element.styles?.responsive?.fullWidth || element.content.fullWidth) && (
          <div className="space-y-2">
            <Label className="text-xs">Width Type</Label>
            <Select
              value={element.styles?.responsive?.widthType || element.content.widthType || 'auto'}
              onValueChange={(value) => {
                const currentResponsive = element.styles?.responsive || {};
                onStyleUpdate('responsive', {
                  ...currentResponsive,
                  widthType: value
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {(element.styles?.responsive?.widthType === 'custom' || element.content.widthType === 'custom') && !(element.styles?.responsive?.fullWidth || element.content.fullWidth) && (
          <div>
            <Label className="text-xs">Custom Width</Label>
            <Input
              value={element.styles?.width || ''}
              onChange={(e) => onStyleUpdate('width', e.target.value)}
              placeholder="e.g., 200px, 50%"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Responsive Typography */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Typography</h4>
        
        <Tabs defaultValue="desktop" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop" className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              Desktop
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              Mobile
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="desktop" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Font Size</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[parseInt(desktopStyles.fontSize?.replace(/\D/g, '') || element.styles?.fontSize?.replace(/\D/g, '') || '16')]}
                  onValueChange={(value) => updateResponsiveStyle('desktop', 'fontSize', `${value[0]}px`)}
                  max={48}
                  min={8}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {desktopStyles.fontSize || element.styles?.fontSize || '16px'}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-xs">Font Weight</Label>
              <Select
                value={desktopStyles.fontWeight || element.styles?.fontWeight || 'normal'}
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
                  <SelectItem value="extrabold">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Letter Spacing</Label>
              <Select
                value={desktopStyles.letterSpacing || 'normal'}
                onValueChange={(value) => updateResponsiveStyle('desktop', 'letterSpacing', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tighter">Tighter</SelectItem>
                  <SelectItem value="tight">Tight</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                  <SelectItem value="wider">Wider</SelectItem>
                  <SelectItem value="widest">Widest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Text Transform</Label>
              <Select
                value={desktopStyles.textTransform || 'none'}
                onValueChange={(value) => updateResponsiveStyle('desktop', 'textTransform', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="uppercase">Uppercase</SelectItem>
                  <SelectItem value="lowercase">Lowercase</SelectItem>
                  <SelectItem value="capitalize">Capitalize</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Padding (Desktop)</Label>
              <Input
                value={desktopStyles.padding || ''}
                onChange={(e) => updateResponsiveStyle('desktop', 'padding', e.target.value)}
                placeholder="e.g., 12px 24px"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="mobile" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Font Size</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[parseInt(mobileStyles.fontSize?.replace(/\D/g, '') || desktopStyles.fontSize?.replace(/\D/g, '') || element.styles?.fontSize?.replace(/\D/g, '') || '14')]}
                  onValueChange={(value) => updateResponsiveStyle('mobile', 'fontSize', `${value[0]}px`)}
                  max={32}
                  min={8}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {mobileStyles.fontSize || '14px'}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-xs">Font Weight</Label>
              <Select
                value={mobileStyles.fontWeight || desktopStyles.fontWeight || element.styles?.fontWeight || 'normal'}
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
                  <SelectItem value="extrabold">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Letter Spacing</Label>
              <Select
                value={mobileStyles.letterSpacing || 'normal'}
                onValueChange={(value) => updateResponsiveStyle('mobile', 'letterSpacing', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tighter">Tighter</SelectItem>
                  <SelectItem value="tight">Tight</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                  <SelectItem value="wider">Wider</SelectItem>
                  <SelectItem value="widest">Widest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Text Transform</Label>
              <Select
                value={mobileStyles.textTransform || 'none'}
                onValueChange={(value) => updateResponsiveStyle('mobile', 'textTransform', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="uppercase">Uppercase</SelectItem>
                  <SelectItem value="lowercase">Lowercase</SelectItem>
                  <SelectItem value="capitalize">Capitalize</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Padding (Mobile)</Label>
              <Input
                value={mobileStyles.padding || ''}
                onChange={(e) => updateResponsiveStyle('mobile', 'padding', e.target.value)}
                placeholder="e.g., 8px 16px"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Text Alignment */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alignment</h4>
        
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
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Colors</h4>
        
        <div>
          <Label className="text-xs">Text Color</Label>
          <Input
            type="color"
            value={element.styles?.color || '#ffffff'}
            onChange={(e) => onStyleUpdate('color', e.target.value)}
            className="w-full h-10"
          />
        </div>

        <div>
          <Label className="text-xs">Background Color</Label>
          <Input
            type="color"
            value={element.styles?.backgroundColor || '#3b82f6'}
            onChange={(e) => onStyleUpdate('backgroundColor', e.target.value)}
            className="w-full h-10"
          />
        </div>
      </div>

      <Separator />

      {/* Border & Effects */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Border & Effects</h4>
        
        <div>
          <Label className="text-xs">Border Radius</Label>
          <Input
            value={element.styles?.borderRadius || ''}
            onChange={(e) => onStyleUpdate('borderRadius', e.target.value)}
            placeholder="e.g., 6px"
          />
        </div>

        <div>
          <Label className="text-xs">Box Shadow</Label>
          <Input
            value={element.styles?.boxShadow || ''}
            onChange={(e) => onStyleUpdate('boxShadow', e.target.value)}
            placeholder="e.g., 0 2px 4px rgba(0,0,0,0.1)"
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
            value={element.styles?.margin || ''}
            onChange={(e) => onStyleUpdate('margin', e.target.value)}
            placeholder="e.g., 10px 0"
          />
        </div>

        {!element.styles?.responsive?.desktop?.padding && !element.styles?.responsive?.mobile?.padding && (
          <div>
            <Label className="text-xs">Padding (Global)</Label>
            <Input
              value={element.styles?.padding || ''}
              onChange={(e) => onStyleUpdate('padding', e.target.value)}
              placeholder="e.g., 12px 24px"
            />
          </div>
        )}
      </div>
    </div>
  );
};