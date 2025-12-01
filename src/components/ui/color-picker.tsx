import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  compact?: boolean;
}

const presetColors = [
  '#FFFFFF', '#000000',
  // Primary - Deep Teal variations
  'hsl(185, 85%, 25%)', 'hsl(185, 85%, 35%)', 'hsl(185, 75%, 88%)',
  // Secondary - Rich Blue variations  
  'hsl(220, 45%, 25%)', 'hsl(220, 65%, 95%)',
  // Accent - Vibrant Orange variations
  'hsl(25, 95%, 55%)', 'hsl(25, 95%, 50%)', 'hsl(25, 85%, 90%)',
  // Success - Bangladesh Green variations
  'hsl(142, 76%, 36%)', 'hsl(142, 76%, 45%)', 'hsl(142, 60%, 92%)',
  // Warning - Soft Yellow variations
  'hsl(48, 97%, 60%)', 'hsl(55, 97%, 88%)', 'hsl(55, 97%, 80%)',
  // Neutral variations
  'hsl(220, 30%, 96%)', 'hsl(215, 20%, 50%)', 'hsl(220, 25%, 90%)',
  // Destructive
  'hsl(0, 84%, 60%)', 'hsl(0, 62%, 31%)'
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label, compact }) => {
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {compact ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onMouseDown={(e) => e.preventDefault()}
            >
              <span className="sr-only">Open color picker</span>
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: color || 'transparent' }}
              />
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-10"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: color || 'transparent' }}
              />
              <span>{color || 'Auto'}</span>
              <Palette className="w-4 h-4 ml-auto" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-4" align="start">
          <div className="space-y-4">
            <div>
              <Label htmlFor="color-input" className="text-xs">Custom Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="color-input"
                  type="color"
                  value={color || '#000000'}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-xs">Preset Colors</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {presetColors.map((presetColor) => (
                  <button
                    key={presetColor}
                    className="w-8 h-8 rounded border-2 border-transparent hover:border-foreground transition-colors"
                    style={{ backgroundColor: presetColor }}
                    onClick={() => onChange(presetColor)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange('')}
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange('transparent')}
                className="flex-1"
              >
                Transparent
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
