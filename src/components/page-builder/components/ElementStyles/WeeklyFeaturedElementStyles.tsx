import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilderElement } from '../../types';
import { WeeklyFeaturedTypographyStyles } from './WeeklyFeaturedTypographyStyles';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';
import { ResponsiveSpacingSliders } from './_shared/ResponsiveSpacingSliders';

interface WeeklyFeaturedElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
  deviceType: 'desktop' | 'tablet' | 'mobile';
}

export const WeeklyFeaturedElementStyles: React.FC<WeeklyFeaturedElementStylesProps> = ({
  element,
  onStyleUpdate,
  deviceType,
}) => {
  const styles = element.styles || {};
  const [responsiveTab, setResponsiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [openGroups, setOpenGroups] = useState({
    typography: true,
    cardAppearance: false,
    spacing: false,
    buttons: false,
  });

  // Get responsive styles
  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentStyles = responsiveStyles[responsiveTab] || {};

  const handleResponsiveUpdate = (property: string, value: any) => {
    const updatedResponsive = {
      ...responsiveStyles,
      [responsiveTab]: {
        ...currentStyles,
        [property]: value
      }
    };
    onStyleUpdate('responsive', updatedResponsive);
  };

  // Helper to get current value with fallback
  const getCurrentValue = (prop: string, fallback: any = '') => {
    return currentStyles[prop] || element.styles?.[prop] || fallback;
  };

  // Helper functions for device-aware spacing conversion
  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', '')) || 0;
  };

  const getCurrentSpacingByDevice = () => {
    const marginByDevice = element.styles?.marginByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    
    const paddingByDevice = element.styles?.paddingByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };

    // Convert legacy spacing to device-aware if needed
    if (!element.styles?.marginByDevice && (element.styles?.marginTop || element.styles?.marginRight || element.styles?.marginBottom || element.styles?.marginLeft)) {
      marginByDevice.desktop = {
        top: parsePixelValue(element.styles?.marginTop),
        right: parsePixelValue(element.styles?.marginRight),
        bottom: parsePixelValue(element.styles?.marginBottom),
        left: parsePixelValue(element.styles?.marginLeft)
      };
    }

    if (!element.styles?.paddingByDevice && (element.styles?.paddingTop || element.styles?.paddingRight || element.styles?.paddingBottom || element.styles?.paddingLeft)) {
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

  const toggleGroup = (group: keyof typeof openGroups) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleSpacingChange = (property: 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft' | 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft', value: string) => {
    handleResponsiveUpdate(property, value);
  };

  return (
    <div className="space-y-4">
      {/* Device Toggle */}
      <div className="space-y-3">
        <Tabs value={responsiveTab} onValueChange={(value) => setResponsiveTab(value as 'desktop' | 'mobile')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop" className="flex items-center gap-2">
              <Monitor className="h-3 w-3" />
              Desktop
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-3 w-3" />
              Mobile
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Typography Styles */}
      <CollapsibleGroup
        title="Typography"
        isOpen={openGroups.typography}
        onToggle={(isOpen) => toggleGroup('typography')}
      >
        <WeeklyFeaturedTypographyStyles
          element={element}
          onStyleUpdate={onStyleUpdate}
        />
      </CollapsibleGroup>

      {/* Card Appearance */}
      <CollapsibleGroup
        title="Card Appearance"
        isOpen={openGroups.cardAppearance}
        onToggle={(isOpen) => toggleGroup('cardAppearance')}
      >
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Background Color</Label>
            <ColorPicker
              color={(styles as any).cardBackground || '#ffffff'}
              onChange={(color) => onStyleUpdate('cardBackground', color)}
              inline={true}
            />
          </div>

          <div>
            <Label className="text-xs">Border Radius</Label>
            <div className="space-y-2">
              <Slider
                value={[parseInt(styles.borderRadius) || 8]}
                onValueChange={(value) => onStyleUpdate('borderRadius', `${value[0]}px`)}
                max={50}
                min={0}
                step={1}
              />
              <span className="text-xs text-muted-foreground">
                {parseInt(styles.borderRadius) || 8}px
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Border Width</Label>
            <div className="space-y-2">
              <Slider
                value={[parseInt(styles.borderWidth) || 0]}
                onValueChange={(value) => onStyleUpdate('borderWidth', `${value[0]}px`)}
                max={10}
                min={0}
                step={1}
              />
              <span className="text-xs text-muted-foreground">
                {parseInt(styles.borderWidth) || 0}px
              </span>
            </div>
          </div>

          {(parseInt(styles.borderWidth) || 0) > 0 && (
            <div>
              <Label className="text-xs">Border Color</Label>
              <ColorPicker
                color={styles.borderColor || '#e5e7eb'}
                onChange={(color) => onStyleUpdate('borderColor', color)}
                inline={true}
              />
            </div>
          )}
        </div>
      </CollapsibleGroup>

      {/* Spacing */}
      <CollapsibleGroup
        title="Spacing"
        isOpen={openGroups.spacing}
        onToggle={(isOpen) => toggleGroup('spacing')}
      >
        <div className="space-y-4">
          <ResponsiveSpacingSliders
            marginByDevice={getCurrentSpacingByDevice().marginByDevice}
            paddingByDevice={getCurrentSpacingByDevice().paddingByDevice}
            onMarginChange={handleMarginChange}
            onPaddingChange={handlePaddingChange}
          />
          
          <div>
            <Label className="text-xs">Card Padding</Label>
            <div className="space-y-2">
              <Slider
                value={[parseInt((styles as any).cardPadding) || 16]}
                onValueChange={(value) => onStyleUpdate('cardPadding', `${value[0]}px`)}
                max={200}
                min={0}
                step={1}
              />
              <span className="text-xs text-muted-foreground">
                {parseInt((styles as any).cardPadding) || 16}px
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Gap Between Cards</Label>
            <div className="space-y-2">
              <Slider
                value={[parseInt((styles as any).gap) || 16]}
                onValueChange={(value) => onStyleUpdate('gap', `${value[0]}px`)}
                max={200}
                min={0}
                step={1}
              />
              <span className="text-xs text-muted-foreground">
                {parseInt((styles as any).gap) || 16}px
              </span>
            </div>
          </div>
        </div>
      </CollapsibleGroup>

      {/* Button Styles */}
      <CollapsibleGroup
        title="Button Styles"
        isOpen={openGroups.buttons}
        onToggle={(isOpen) => toggleGroup('buttons')}
      >
        <div className="space-y-3">
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
                  inline={true}
                />
              </div>
              <div>
                <Label className="text-xs">Button Text Color</Label>
                <ColorPicker
                  color={(styles as any).buttonTextColor || '#ffffff'}
                  onChange={(color) => onStyleUpdate('buttonTextColor', color)}
                  inline={true}
                />
              </div>
              <div>
                <Label className="text-xs">Button Hover Background</Label>
                <ColorPicker
                  color={(styles as any).buttonHoverBackground || '#333333'}
                  onChange={(color) => onStyleUpdate('buttonHoverBackground', color)}
                  inline={true}
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
      </CollapsibleGroup>
    </div>
  );
};