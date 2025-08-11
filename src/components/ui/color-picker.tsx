import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  compact?: boolean;
}

const presetColors = [
  '#10B981', '#059669', '#047857', '#065F46',
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',
  '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6',
  '#EF4444', '#DC2626', '#B91C1C', '#991B1B',
  '#F59E0B', '#D97706', '#B45309', '#92400E',
  '#6B7280', '#4B5563', '#374151', '#1F2937'
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label, compact }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {compact ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
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
            >
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: color || 'transparent' }}
              />
              <span>{color || 'Auto'}</span>
              <Palette className="w-4 h-4 ml-auto" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4 bg-popover z-[90]">
          <div className="space-y-4">
            <div>
              <Label htmlFor="color-input">Custom Color</Label>
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
              <Label>Preset Colors</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {presetColors.map((presetColor) => (
                  <button
                    key={presetColor}
                    className="w-8 h-8 rounded border-2 border-transparent hover:border-foreground transition-colors"
                    style={{ backgroundColor: presetColor }}
                    onClick={() => {
                      onChange(presetColor);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
              >
                Reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange('transparent');
                  setIsOpen(false);
                }}
              >
                Transparent
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
