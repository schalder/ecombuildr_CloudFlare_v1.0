import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';
import { useDevicePreview } from '../../contexts/DevicePreviewContext';

interface MediaElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const MediaElementStyles: React.FC<MediaElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  // Use global device state instead of local state
  const { deviceType: responsiveTab, setDeviceType: setResponsiveTab } = useDevicePreview();
  const [dimensionsOpen, setDimensionsOpen] = React.useState(true);
  const [backgroundOpen, setBackgroundOpen] = React.useState(false);
  const [borderOpen, setBorderOpen] = React.useState(false);
  const [effectsOpen, setEffectsOpen] = React.useState(false);
  const [spacingOpen, setSpacingOpen] = React.useState(false);
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
      {/* Device Toggle */}
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

      {/* Dimensions - Hide for video elements */}
      {element.type !== 'video' && (
        <CollapsibleGroup title="Dimensions" isOpen={dimensionsOpen} onToggle={setDimensionsOpen}>
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
        </CollapsibleGroup>
      )}

      {/* Background */}
      <CollapsibleGroup title="Background" isOpen={backgroundOpen} onToggle={setBackgroundOpen}>
        <ColorPicker
          label="Background Color"
          color={element.styles?.backgroundColor || ''}
          onChange={(color) => onStyleUpdate('backgroundColor', color)}
        />
      </CollapsibleGroup>

      {/* Border */}
      <CollapsibleGroup title="Border" isOpen={borderOpen} onToggle={setBorderOpen}>
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
            placeholder="e.g., 4px"
          />
        </div>
      </CollapsibleGroup>

      {/* Effects */}
      <CollapsibleGroup title="Effects" isOpen={effectsOpen} onToggle={setEffectsOpen}>
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
      </CollapsibleGroup>

      {/* Spacing */}
      <CollapsibleGroup title="Spacing" isOpen={spacingOpen} onToggle={setSpacingOpen}>
        <SpacingSliders
          marginTop={element.styles?.marginTop as string}
          marginRight={element.styles?.marginRight as string}
          marginBottom={element.styles?.marginBottom as string}
          marginLeft={element.styles?.marginLeft as string}
          paddingTop={element.styles?.paddingTop as string}
          paddingRight={element.styles?.paddingRight as string}
          paddingBottom={element.styles?.paddingBottom as string}
          paddingLeft={element.styles?.paddingLeft as string}
          onMarginChange={(property, value) => onStyleUpdate(property, value)}
          onPaddingChange={(property, value) => onStyleUpdate(property, value)}
        />
      </CollapsibleGroup>
    </div>
  );
};