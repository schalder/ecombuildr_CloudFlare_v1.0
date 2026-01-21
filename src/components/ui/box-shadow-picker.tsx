import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';

interface BoxShadowPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const BoxShadowPicker: React.FC<BoxShadowPickerProps> = ({ value, onChange, label }) => {
  const [shadowType, setShadowType] = useState<'outer' | 'inner'>('outer');
  
  // Parse current value
  const parseShadow = (shadowValue: string) => {
    if (!shadowValue || shadowValue === 'none') {
      return { x: 0, y: 0, blur: 0, spread: 0, color: '#000000', opacity: 0.2, inset: false };
    }
    
    const isInset = shadowValue.includes('inset');
    const parts = shadowValue.replace('inset', '').trim().split(/\s+/);
    
    // Extract rgba color
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
    
    // Parse x, y, blur, spread (format: x y blur spread)
    const x = parts[0] ? parseInt(parts[0]) || 0 : 0;
    const y = parts[1] ? parseInt(parts[1]) || 0 : 0;
    const blur = parts[2] ? parseInt(parts[2]) || 0 : 0;
    const spread = parts[3] ? parseInt(parts[3]) || 0 : 0;
    
    return { x, y, blur, spread, color, opacity, inset: isInset };
  };

  const [shadow, setShadow] = useState(parseShadow(value));

  // Update shadow when value prop changes
  useEffect(() => {
    const parsed = parseShadow(value);
    setShadow(parsed);
    setShadowType(parsed.inset ? 'inner' : 'outer');
  }, [value]);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const generateShadow = () => {
    if (shadow.x === 0 && shadow.y === 0 && shadow.blur === 0 && shadow.spread === 0) {
      return 'none';
    }
    const rgba = hexToRgba(shadow.color, shadow.opacity);
    const insetPrefix = shadowType === 'inner' ? 'inset ' : '';
    return `${insetPrefix}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${rgba}`;
  };

  // Auto-apply shadow when any value changes
  useEffect(() => {
    const newShadow = generateShadow();
    onChange(newShadow);
  }, [shadow.x, shadow.y, shadow.blur, shadow.spread, shadow.color, shadow.opacity, shadowType]);

  const updateShadow = (key: keyof typeof shadow, value: number | string | boolean) => {
    setShadow(prev => ({ ...prev, [key]: value }));
  };

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

  return (
    <div className="space-y-3">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
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
            onChange={(color) => updateShadow('color', color)}
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
