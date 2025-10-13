import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { useDevicePreview } from '../../../contexts/DevicePreviewContext';

interface SpacingValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ResponsiveSpacing {
  desktop?: SpacingValues;
  tablet?: SpacingValues;
  mobile?: SpacingValues;
}

interface ResponsiveSpacingSlidersProps {
  marginByDevice?: ResponsiveSpacing;
  paddingByDevice?: ResponsiveSpacing;
  onMarginChange: (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => void;
  onPaddingChange: (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => void;
}

export const ResponsiveSpacingSliders: React.FC<ResponsiveSpacingSlidersProps> = ({
  marginByDevice,
  paddingByDevice,
  onMarginChange,
  onPaddingChange
}) => {
  const { deviceType: responsiveTab, setDeviceType: setResponsiveTab } = useDevicePreview();

  // Get current spacing values with proper defaults and inheritance
  const getCurrentSpacing = (spacingByDevice?: ResponsiveSpacing): SpacingValues => {
    if (!spacingByDevice) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    // Current device value
    const currentValue = spacingByDevice[responsiveTab];
    if (currentValue) {
      return currentValue;
    }

    // Inheritance logic: mobile -> tablet -> desktop
    if (responsiveTab === 'mobile') {
      const tabletValue = spacingByDevice.tablet;
      if (tabletValue) {
        return tabletValue;
      }
    }
    
    if (responsiveTab === 'mobile' || responsiveTab === 'tablet') {
      const desktopValue = spacingByDevice.desktop;
      if (desktopValue) {
        return desktopValue;
      }
    }

    return { top: 0, right: 0, bottom: 0, left: 0 };
  };

  const currentMargin = getCurrentSpacing(marginByDevice);
  const currentPadding = getCurrentSpacing(paddingByDevice);

  const clampNumber = (value: number): number => {
    return Math.max(0, Math.min(200, value));
  };

  const handleMarginChange = (property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    onMarginChange(responsiveTab, property, clampNumber(value));
  };

  const handlePaddingChange = (property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    onPaddingChange(responsiveTab, property, clampNumber(value));
  };

  const handleMarginInputChange = (property: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    const numValue = clampNumber(parseInt(value) || 0);
    handleMarginChange(property, numValue);
  };

  const handlePaddingInputChange = (property: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    const numValue = clampNumber(parseInt(value) || 0);
    handlePaddingChange(property, numValue);
  };

  return (
    <div className="space-y-4">
      {/* Device Selector */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <Button
          variant={responsiveTab === 'desktop' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setResponsiveTab('desktop')}
          className="h-8 px-2"
        >
          <Monitor className="h-3 w-3" />
        </Button>
        <Button
          variant={responsiveTab === 'tablet' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setResponsiveTab('tablet')}
          className="h-8 px-2"
        >
          <Tablet className="h-3 w-3" />
        </Button>
        <Button
          variant={responsiveTab === 'mobile' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setResponsiveTab('mobile')}
          className="h-8 px-2"
        >
          <Smartphone className="h-3 w-3" />
        </Button>
      </div>

      {/* Margin Controls */}
      <div>
        <Label className="text-xs font-medium mb-3 block">Margin</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Top</Label>
            <Slider
              value={[currentMargin.top]}
              onValueChange={(value) => handleMarginChange('top', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={currentMargin.top}
              onChange={(e) => handleMarginInputChange('top', e.target.value)}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Right</Label>
            <Slider
              value={[currentMargin.right]}
              onValueChange={(value) => handleMarginChange('right', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={currentMargin.right}
              onChange={(e) => handleMarginInputChange('right', e.target.value)}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Bottom</Label>
            <Slider
              value={[currentMargin.bottom]}
              onValueChange={(value) => handleMarginChange('bottom', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={currentMargin.bottom}
              onChange={(e) => handleMarginInputChange('bottom', e.target.value)}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Left</Label>
            <Slider
              value={[currentMargin.left]}
              onValueChange={(value) => handleMarginChange('left', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={currentMargin.left}
              onChange={(e) => handleMarginInputChange('left', e.target.value)}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
        </div>
      </div>

      {/* Padding Controls */}
      <div>
        <Label className="text-xs font-medium mb-3 block">Padding</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Top</Label>
            <Slider
              value={[currentPadding.top]}
              onValueChange={(value) => handlePaddingChange('top', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={currentPadding.top}
              onChange={(e) => handlePaddingInputChange('top', e.target.value)}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Right</Label>
            <Slider
              value={[currentPadding.right]}
              onValueChange={(value) => handlePaddingChange('right', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={currentPadding.right}
              onChange={(e) => handlePaddingInputChange('right', e.target.value)}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Bottom</Label>
            <Slider
              value={[currentPadding.bottom]}
              onValueChange={(value) => handlePaddingChange('bottom', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={currentPadding.bottom}
              onChange={(e) => handlePaddingInputChange('bottom', e.target.value)}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Left</Label>
            <Slider
              value={[currentPadding.left]}
              onValueChange={(value) => handlePaddingChange('left', value[0])}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={currentPadding.left}
              onChange={(e) => handlePaddingInputChange('left', e.target.value)}
              min={0}
              max={200}
              step={1}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
        </div>
      </div>
    </div>
  );
};
