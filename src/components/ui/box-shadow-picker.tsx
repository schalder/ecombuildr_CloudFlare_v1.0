import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ColorPicker } from '@/components/ui/color-picker';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Box, Palette, X } from 'lucide-react';

interface BoxShadowPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

// Box shadow presets
const BOX_SHADOW_PRESETS = {
  none: { name: 'None', value: 'none' },
  sm: { name: 'Small', value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  default: { name: 'Default', value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)' },
  md: { name: 'Medium', value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)' },
  lg: { name: 'Large', value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' },
  xl: { name: 'Extra Large', value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' },
  '2xl': { name: '2X Large', value: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  inner: { name: 'Inner', value: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)' },
  glow: { name: 'Glow', value: '0 0 20px rgba(59, 130, 246, 0.5)' },
  colored: { name: 'Colored', value: '0 4px 14px 0 rgba(139, 92, 246, 0.3)' },
  soft: { name: 'Soft', value: '0 8px 30px rgba(0, 0, 0, 0.12)' },
  harsh: { name: 'Harsh', value: '0 2px 10px rgba(0, 0, 0, 0.3)' }
};

export const BoxShadowPicker: React.FC<BoxShadowPickerProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  // Custom shadow state
  const [offsetX, setOffsetX] = useState([0]);
  const [offsetY, setOffsetY] = useState([4]);
  const [blurRadius, setBlurRadius] = useState([6]);
  const [spreadRadius, setSpreadRadius] = useState([0]);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [opacity, setOpacity] = useState([0.1]);
  const [inset, setInset] = useState(false);

  const getCurrentPreset = () => {
    const preset = Object.entries(BOX_SHADOW_PRESETS).find(([_, preset]) => preset.value === value);
    return preset ? preset[1].name : 'Custom';
  };

  const handlePresetChange = (presetKey: string) => {
    const preset = BOX_SHADOW_PRESETS[presetKey as keyof typeof BOX_SHADOW_PRESETS];
    if (preset) {
      onChange(preset.value);
      setIsOpen(false);
    }
  };

  const generateCustomShadow = () => {
    const rgba = hexToRgba(shadowColor, opacity[0]);
    const insetPrefix = inset ? 'inset ' : '';
    const shadow = `${insetPrefix}${offsetX[0]}px ${offsetY[0]}px ${blurRadius[0]}px ${spreadRadius[0]}px ${rgba}`;
    return shadow;
  };

  const applyCustomShadow = () => {
    const shadow = generateCustomShadow();
    onChange(shadow);
    setIsOpen(false);
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const clearShadow = () => {
    onChange('none');
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-10"
          >
            <Box className="w-4 h-4" />
            <span className="flex-1 text-left">{getCurrentPreset()}</span>
            <Palette className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <Tabs defaultValue="presets" className="w-full">
            <div className="p-4 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="presets">Presets</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="presets" className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <Label>Shadow Presets</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearShadow}
                  className="h-8 px-2"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {Object.entries(BOX_SHADOW_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key)}
                    className="text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{preset.name}</span>
                      <div 
                        className="w-6 h-6 bg-background border rounded shadow-sm"
                        style={{ 
                          boxShadow: preset.value === 'none' ? 'none' : preset.value,
                          backgroundColor: 'white'
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {preset.value}
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="p-4 space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Offset X</Label>
                    <Slider
                      value={offsetX}
                      onValueChange={setOffsetX}
                      min={-50}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{offsetX[0]}px</div>
                  </div>
                  <div>
                    <Label className="text-xs">Offset Y</Label>
                    <Slider
                      value={offsetY}
                      onValueChange={setOffsetY}
                      min={-50}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{offsetY[0]}px</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Blur Radius</Label>
                    <Slider
                      value={blurRadius}
                      onValueChange={setBlurRadius}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{blurRadius[0]}px</div>
                  </div>
                  <div>
                    <Label className="text-xs">Spread</Label>
                    <Slider
                      value={spreadRadius}
                      onValueChange={setSpreadRadius}
                      min={-50}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{spreadRadius[0]}px</div>
                  </div>
                </div>

                <div>
                  <ColorPicker
                    color={shadowColor}
                    onChange={setShadowColor}
                    label="Shadow Color"
                  />
                </div>

                <div>
                  <Label className="text-xs">Opacity</Label>
                  <Slider
                    value={opacity}
                    onValueChange={setOpacity}
                    min={0}
                    max={1}
                    step={0.01}
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">{Math.round(opacity[0] * 100)}%</div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="inset"
                    checked={inset}
                    onChange={(e) => setInset(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="inset" className="text-xs">Inner Shadow</Label>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label className="text-xs">Preview</Label>
                  <div 
                    className="w-full h-16 bg-background border rounded-md"
                    style={{ 
                      boxShadow: generateCustomShadow(),
                      backgroundColor: 'white'
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={applyCustomShadow} className="flex-1" size="sm">
                    Apply Shadow
                  </Button>
                  <Button onClick={clearShadow} variant="outline" size="sm">
                    Clear
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
};