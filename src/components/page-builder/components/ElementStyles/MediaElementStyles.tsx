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
import { ResponsiveSpacingSliders } from './_shared/ResponsiveSpacingSliders';
import { useDevicePreview } from '../../contexts/DevicePreviewContext';

// Width presets for image elements
const WIDTH_PRESETS = [
  { label: 'Full Width', value: '100%' },
  { label: '3/4 Width', value: '75%' },
  { label: 'Half Width', value: '50%' },
  { label: '1/3 Width', value: '33.333%' },
  { label: '1/4 Width', value: '25%' },
  { label: 'Auto', value: 'auto' }
];

interface MediaElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
  onContentUpdate: (property: string, value: any) => void;
}

export const MediaElementStyles: React.FC<MediaElementStylesProps> = ({
  element,
  onStyleUpdate,
  onContentUpdate,
}) => {
  // Use global device state instead of local state
  const { deviceType: responsiveTab, setDeviceType: setResponsiveTab } = useDevicePreview();
  const [dimensionsOpen, setDimensionsOpen] = React.useState(true);
  const [backgroundOpen, setBackgroundOpen] = React.useState(false);
  const [borderOpen, setBorderOpen] = React.useState(false);
  const [effectsOpen, setEffectsOpen] = React.useState(false);
  const [spacingOpen, setSpacingOpen] = React.useState(false);
  const [playlistButtonOpen, setPlaylistButtonOpen] = React.useState(false);
  const [audioPlayerColorsOpen, setAudioPlayerColorsOpen] = React.useState(false);
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

  // Helper function to get current width value
  const getCurrentWidth = () => {
    return (currentStyles.width || element.styles?.width || '100%') as string;
  };

  // Helper functions for device-aware spacing conversion
  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', '')) || 0;
  };

  const getCurrentSpacingByDevice = () => {
    const marginByDevice = (element.styles as any)?.marginByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    
    const paddingByDevice = (element.styles as any)?.paddingByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };

    // Convert legacy spacing to device-aware if needed
    if (!(element.styles as any)?.marginByDevice && (element.styles?.marginTop || element.styles?.marginRight || element.styles?.marginBottom || element.styles?.marginLeft)) {
      marginByDevice.desktop = {
        top: parsePixelValue(element.styles?.marginTop),
        right: parsePixelValue(element.styles?.marginRight),
        bottom: parsePixelValue(element.styles?.marginBottom),
        left: parsePixelValue(element.styles?.marginLeft)
      };
    }

    if (!(element.styles as any)?.paddingByDevice && (element.styles?.paddingTop || element.styles?.paddingRight || element.styles?.paddingBottom || element.styles?.paddingLeft)) {
      paddingByDevice.desktop = {
        top: parsePixelValue(element.styles?.paddingTop),
        right: parsePixelValue(element.styles?.paddingRight),
        bottom: parsePixelValue(element.styles?.paddingBottom),
        left: parsePixelValue(element.styles?.paddingLeft)
      };
    }

    return { marginByDevice, paddingByDevice };
  };

  const handleMarginChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const { marginByDevice } = getCurrentSpacingByDevice();
    const updated = { ...marginByDevice };
    updated[device] = { ...updated[device], [property]: value };
    onStyleUpdate('marginByDevice', updated);
  };

  const handlePaddingChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const { paddingByDevice } = getCurrentSpacingByDevice();
    const updated = { ...paddingByDevice };
    updated[device] = { ...updated[device], [property]: value };
    onStyleUpdate('paddingByDevice', updated);
  };

  // Helper function to check if current width is a preset
  const isPresetWidth = (width: string) => {
    return WIDTH_PRESETS.some(preset => preset.value === width);
  };

  // Helper function to get preset label for current width
  const getCurrentPresetLabel = () => {
    const currentWidth = getCurrentWidth();
    const preset = WIDTH_PRESETS.find(p => p.value === currentWidth);
    return preset ? preset.label : 'Full Width';
  };

  // Helper function to handle width preset change
  const handleWidthPresetChange = (value: string) => {
    handleResponsiveUpdate('width', value);
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

      {/* Dimensions - Show for all media elements except single video */}
      {element.type !== 'video' && (
        <CollapsibleGroup title="Dimensions" isOpen={dimensionsOpen} onToggle={setDimensionsOpen}>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Width</Label>
              <Select
                value={isPresetWidth(getCurrentWidth()) ? getCurrentWidth() : '100%'}
                onValueChange={handleWidthPresetChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select width preset" />
                </SelectTrigger>
                <SelectContent>
                  {WIDTH_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Audio Player Colors - Only for audio-player */}
      {element.type === 'audio-player' && (
        <CollapsibleGroup title="Audio Player Colors" isOpen={audioPlayerColorsOpen} onToggle={setAudioPlayerColorsOpen}>
          <div className="space-y-4">
            <ColorPicker
              label="Player Background Color"
              color={element.styles?.playerBackgroundColor || ''}
              onChange={(color) => onStyleUpdate('playerBackgroundColor', color)}
            />
            
            <ColorPicker
              label="Button Color"
              color={element.styles?.buttonColor || ''}
              onChange={(color) => onStyleUpdate('buttonColor', color)}
            />
            
            <ColorPicker
              label="Progress Bar Color"
              color={element.styles?.progressBarColor || ''}
              onChange={(color) => onStyleUpdate('progressBarColor', color)}
            />
          </div>
        </CollapsibleGroup>
      )}

      {/* Playlist Button Styling - Only for video-playlist */}
      {element.type === 'video-playlist' && (
        <CollapsibleGroup title="Playlist Button Styling" isOpen={playlistButtonOpen} onToggle={setPlaylistButtonOpen}>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Font Size</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[element.content?.buttonFontSize || 14]}
                  onValueChange={([value]) => onContentUpdate('buttonFontSize', value)}
                  min={12}
                  max={24}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {element.content?.buttonFontSize || 14}px
                </span>
              </div>
            </div>
            
            <div>
              <Label className="text-xs">Font Weight</Label>
              <Select
                value={element.content?.buttonFontWeight || '400'}
                onValueChange={(value) => onContentUpdate('buttonFontWeight', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Normal (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semi Bold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Font Color</Label>
              <ColorPicker
                color={element.content?.buttonFontColor || '#ffffff'}
                onChange={(color) => onContentUpdate('buttonFontColor', color)}
              />
            </div>
            
            <div>
              <Label className="text-xs">Background Color</Label>
              <ColorPicker
                color={element.content?.buttonBackgroundColor || '#000000'}
                onChange={(color) => onContentUpdate('buttonBackgroundColor', color)}
              />
            </div>

            <div>
              <Label className="text-xs">Hover Background</Label>
              <ColorPicker
                color={element.content?.buttonHoverBackground || '#333333'}
                onChange={(color) => onContentUpdate('buttonHoverBackground', color)}
              />
            </div>
            
            <div>
              <Label className="text-xs">Active Background</Label>
              <ColorPicker
                color={element.content?.buttonActiveBackground || '#0066cc'}
                onChange={(color) => onContentUpdate('buttonActiveBackground', color)}
              />
            </div>

            <div>
              <Label className="text-xs">Padding</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[element.content?.buttonPadding || 8]}
                  onValueChange={([value]) => onContentUpdate('buttonPadding', value)}
                  min={4}
                  max={20}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {element.content?.buttonPadding || 8}px
                </span>
              </div>
            </div>
            
            <div>
              <Label className="text-xs">Border Radius</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[element.content?.buttonBorderRadius || 4]}
                  onValueChange={([value]) => onContentUpdate('buttonBorderRadius', value)}
                  min={0}
                  max={20}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {element.content?.buttonBorderRadius || 4}px
                </span>
              </div>
            </div>

            <div>
              <Label className="text-xs">Button Gap</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[element.content?.buttonGap || 8]}
                  onValueChange={([value]) => onContentUpdate('buttonGap', value)}
                  min={0}
                  max={32}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {element.content?.buttonGap || 8}px
                </span>
              </div>
            </div>
          </div>
        </CollapsibleGroup>
      )}

      {/* Spacing */}
      <CollapsibleGroup title="Spacing" isOpen={spacingOpen} onToggle={setSpacingOpen}>
        <ResponsiveSpacingSliders
          marginByDevice={getCurrentSpacingByDevice().marginByDevice}
          paddingByDevice={getCurrentSpacingByDevice().paddingByDevice}
          onMarginChange={handleMarginChange}
          onPaddingChange={handlePaddingChange}
        />
      </CollapsibleGroup>
    </div>
  );
};