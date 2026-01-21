import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface BoxShadowPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const BoxShadowPicker: React.FC<BoxShadowPickerProps> = ({ value, onChange, label }) => {
  const [shadowType, setShadowType] = useState<'outer' | 'inner'>('outer');
  const isInternalUpdate = useRef(false);
  const lastGeneratedShadow = useRef<string>('');
  
  // ✅ Convert HSL/RGB to hex
  const colorToHex = useCallback((color: string): string => {
    if (!color) return '#000000';
    
    // Already hex
    if (color.startsWith('#')) {
      return color.length === 7 ? color : '#000000';
    }
    
    // HSL format: hsl(0, 84%, 60%)
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
      const h = parseInt(hslMatch[1]) / 360;
      const s = parseInt(hslMatch[2]) / 100;
      const l = parseInt(hslMatch[3]) / 100;
      
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h * 6) % 2 - 1));
      const m = l - c / 2;
      
      let r = 0, g = 0, b = 0;
      
      if (h < 1/6) { r = c; g = x; b = 0; }
      else if (h < 2/6) { r = x; g = c; b = 0; }
      else if (h < 3/6) { r = 0; g = c; b = x; }
      else if (h < 4/6) { r = 0; g = x; b = c; }
      else if (h < 5/6) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }
      
      r = Math.round((r + m) * 255);
      g = Math.round((g + m) * 255);
      b = Math.round((b + m) * 255);
      
      return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    }
    
    // RGB format: rgb(255, 0, 0)
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    }
    
    return '#000000';
  }, []);
  
  // Parse current value
  const parseShadow = useCallback((shadowValue: string) => {
    if (!shadowValue || shadowValue === 'none') {
      return { x: 0, y: 0, blur: 0, spread: 0, color: '#000000', opacity: 0.2, inset: false };
    }
    
    const isInset = shadowValue.includes('inset');
    const parts = shadowValue.replace(/inset\s+/i, '').trim().split(/\s+/);
    
    // Extract rgba color - improved regex to handle various formats
    const rgbaMatch = shadowValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    let color = '#000000';
    let opacity = 0.2;
    
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
      color = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
      opacity = a;
    }
    
    // Parse x, y, blur, spread (format: xpx ypx blurpx spreadpx or x y blur spread)
    const x = parts[0] ? parseInt(parts[0].replace('px', '')) || 0 : 0;
    const y = parts[1] ? parseInt(parts[1].replace('px', '')) || 0 : 0;
    const blur = parts[2] ? parseInt(parts[2].replace('px', '')) || 0 : 0;
    const spread = parts[3] ? parseInt(parts[3].replace('px', '')) || 0 : 0;
    
    return { x, y, blur, spread, color, opacity, inset: isInset };
  }, []);

  const [shadow, setShadow] = useState(() => parseShadow(value));

  const hexToRgba = useCallback((hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  const generateShadow = useCallback(() => {
    if (shadow.x === 0 && shadow.y === 0 && shadow.blur === 0 && shadow.spread === 0) {
      return 'none';
    }
    const rgba = hexToRgba(shadow.color, shadow.opacity);
    const insetPrefix = shadowType === 'inner' ? 'inset ' : '';
    return `${insetPrefix}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${rgba}`;
  }, [shadow.x, shadow.y, shadow.blur, shadow.spread, shadow.color, shadow.opacity, shadowType, hexToRgba]);

  // Update shadow when value prop changes (only if it's an external change)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    
    // Only update if the value is different from what we last generated
    if (value === lastGeneratedShadow.current) {
      return;
    }
    
    const parsed = parseShadow(value);
    setShadow(parsed);
    setShadowType(parsed.inset ? 'inner' : 'outer');
    lastGeneratedShadow.current = value;
  }, [value, parseShadow]);

  // Auto-apply shadow when any value changes (only if it's an internal change)
  useEffect(() => {
    const rgba = hexToRgba(shadow.color, shadow.opacity);
    const insetPrefix = shadowType === 'inner' ? 'inset ' : '';
    const newShadow = shadow.x === 0 && shadow.y === 0 && shadow.blur === 0 && shadow.spread === 0
      ? 'none'
      : `${insetPrefix}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${rgba}`;
    
    if (newShadow !== lastGeneratedShadow.current) {
      isInternalUpdate.current = true;
      lastGeneratedShadow.current = newShadow;
      onChange(newShadow);
    }
  }, [shadow.x, shadow.y, shadow.blur, shadow.spread, shadow.color, shadow.opacity, shadowType, hexToRgba, onChange]);

  const updateShadow = useCallback((key: keyof typeof shadow, val: number | string | boolean) => {
    setShadow(prev => ({ ...prev, [key]: val }));
  }, []);

  // ✅ Handle color change - convert HSL/RGB to hex
  const handleColorChange = useCallback((color: string) => {
    const hexColor = colorToHex(color);
    updateShadow('color', hexColor);
  }, [colorToHex, updateShadow]);

  const handleInputChange = (key: 'x' | 'y' | 'blur' | 'spread', value: string) => {
    const numValue = parseInt(value) || 0;
    updateShadow(key, numValue);
  };

  const handleSliderChange = (key: 'x' | 'y' | 'blur' | 'spread', value: number[]) => {
    updateShadow(key, value[0]);
  };

  const handleShadowTypeChange = (type: 'outer' | 'inner') => {
    setShadowType(type);
    updateShadow('inset', type === 'inner');
  };

  // ✅ Handle reset - clear all shadow values
  const handleReset = useCallback(() => {
    isInternalUpdate.current = true;
    lastGeneratedShadow.current = 'none';
    setShadow({ x: 0, y: 0, blur: 0, spread: 0, color: '#000000', opacity: 0.2, inset: false });
    setShadowType('outer');
    onChange('none');
  }, [onChange]);

  // Check if shadow is active (not 'none')
  const hasShadow = value && value !== 'none';

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          {hasShadow && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-7 px-2 text-xs"
              title="Reset box shadow"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      )}
      
      {/* Shadow Type Tabs */}
      <Tabs value={shadowType} onValueChange={(v) => handleShadowTypeChange(v as 'outer' | 'inner')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="outer">Outer Shadow</TabsTrigger>
          <TabsTrigger value="inner">Inner Shadow</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Shadow Controls */}
      <div className="space-y-3">
        {/* X Offset */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">X</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[shadow.x]}
              onValueChange={(v) => handleSliderChange('x', v)}
              min={-50}
              max={50}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={shadow.x}
              onChange={(e) => handleInputChange('x', e.target.value)}
              className="w-20 h-8 text-xs"
              min={-50}
              max={50}
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
        </div>

        {/* Y Offset */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Y</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[shadow.y]}
              onValueChange={(v) => handleSliderChange('y', v)}
              min={-50}
              max={50}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={shadow.y}
              onChange={(e) => handleInputChange('y', e.target.value)}
              className="w-20 h-8 text-xs"
              min={-50}
              max={50}
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
        </div>

        {/* Blur */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Blur</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[shadow.blur]}
              onValueChange={(v) => handleSliderChange('blur', v)}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={shadow.blur}
              onChange={(e) => handleInputChange('blur', e.target.value)}
              className="w-20 h-8 text-xs"
              min={0}
              max={100}
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
        </div>

        {/* Spread */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Spread</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[shadow.spread]}
              onValueChange={(v) => handleSliderChange('spread', v)}
              min={-50}
              max={50}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={shadow.spread}
              onChange={(e) => handleInputChange('spread', e.target.value)}
              className="w-20 h-8 text-xs"
              min={-50}
              max={50}
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Color</Label>
          <ColorPicker
            color={shadow.color}
            onChange={handleColorChange}
            label=""
          />
        </div>

        {/* Opacity Slider */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Opacity</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[shadow.opacity]}
              onValueChange={(v) => updateShadow('opacity', v[0])}
              min={0}
              max={1}
              step={0.01}
              className="flex-1"
            />
            <Input
              type="number"
              value={Math.round(shadow.opacity * 100)}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                updateShadow('opacity', Math.max(0, Math.min(100, val)) / 100);
              }}
              className="w-20 h-8 text-xs"
              min={0}
              max={100}
            />
            <span className="text-xs text-muted-foreground w-6">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
