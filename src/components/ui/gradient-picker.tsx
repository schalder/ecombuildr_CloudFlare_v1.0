import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';

interface GradientPickerProps {
  value?: string;
  onChange: (gradient: string) => void;
  label?: string;
}

const PRESET_GRADIENTS = [
  {
    name: 'Sunset',
    value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)'
  },
  {
    name: 'Ocean',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    name: 'Forest',
    value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    name: 'Fire',
    value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  {
    name: 'Purple Rain',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    name: 'Mint',
    value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  },
  {
    name: 'Gold',
    value: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)'
  },
  {
    name: 'Rose',
    value: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)'
  },
  {
    name: 'Sky',
    value: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)'
  },
  {
    name: 'Violet',
    value: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)'
  }
];

function GradientPicker({ value = '', onChange, label = 'Gradient' }: GradientPickerProps) {
  const [customGradient, setCustomGradient] = useState(value);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handlePresetSelect = (gradient: string) => {
    setCustomGradient(gradient);
    onChange(gradient);
  };

  const handleCustomChange = (gradient: string) => {
    setCustomGradient(gradient);
    onChange(gradient);
  };

  const copyToClipboard = (gradient: string, index: number) => {
    navigator.clipboard.writeText(gradient);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearGradient = () => {
    setCustomGradient('');
    onChange('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {value && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearGradient}
            className="h-6 px-2 text-xs"
          >
            Clear
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
        
        <TabsContent value="presets" className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {PRESET_GRADIENTS.map((preset, index) => (
              <div
                key={preset.name}
                className="group relative cursor-pointer"
                onClick={() => handlePresetSelect(preset.value)}
              >
                <div
                  className="h-12 rounded-md border-2 border-transparent group-hover:border-primary transition-colors"
                  style={{ background: preset.value }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="secondary" className="text-xs">
                    {preset.name}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(preset.value, index);
                  }}
                >
                  {copiedIndex === index ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="custom-gradient">CSS Gradient</Label>
            <Input
              id="custom-gradient"
              value={customGradient}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              className="font-mono text-xs"
            />
          </div>
          
          {customGradient && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div
                className="h-12 rounded-md border"
                style={{ background: customGradient }}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Examples:</Label>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>linear-gradient(45deg, #ff0000, #0000ff)</div>
              <div>radial-gradient(circle, #ffffff, #000000)</div>
              <div>conic-gradient(from 0deg, #ff0000, #00ff00, #0000ff)</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default GradientPicker;