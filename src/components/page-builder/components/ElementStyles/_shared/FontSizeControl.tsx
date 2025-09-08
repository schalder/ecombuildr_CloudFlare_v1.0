import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface FontSizeControlProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  defaultSize?: string;
}

export const FontSizeControl: React.FC<FontSizeControlProps> = ({
  value,
  onChange,
  min = 8,
  max = 72,
  defaultSize = '16px'
}) => {
  const currentValue = value || defaultSize;
  const numericValue = parseInt(currentValue.toString().replace(/\D/g, '')) || parseInt(defaultSize.replace(/\D/g, ''));
  
  // Local state for smooth slider interaction
  const [localValue, setLocalValue] = useState(numericValue);
  const [isSliding, setIsSliding] = useState(false);

  // Sync local state when external value changes (device switch, etc.)
  useEffect(() => {
    if (!isSliding) {
      setLocalValue(numericValue);
    }
  }, [numericValue, isSliding]);

  const handleSliderChange = (newValues: number[]) => {
    const newValue = newValues[0];
    setLocalValue(newValue);
    setIsSliding(true);
  };

  const handleSliderCommit = (newValues: number[]) => {
    const newValue = newValues[0];
    setLocalValue(newValue);
    onChange(`${newValue}px`);
    setIsSliding(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || min;
    const clampedVal = Math.max(min, Math.min(max, val));
    setLocalValue(clampedVal);
    onChange(`${clampedVal}px`);
  };

  const handleInputBlur = () => {
    // Ensure the value is within bounds on blur
    const clampedVal = Math.max(min, Math.min(max, localValue));
    if (clampedVal !== localValue) {
      setLocalValue(clampedVal);
      onChange(`${clampedVal}px`);
    }
  };

  const displayValue = isSliding ? localValue : numericValue;

  return (
    <div className="flex items-center space-x-2">
      <Slider
        value={[displayValue]}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderCommit}
        max={max}
        min={min}
        step={1}
        className="flex-1"
      />
      <Input
        type="number"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        min={min}
        max={max}
        className="w-16 h-8"
      />
      <span className="text-xs text-muted-foreground">px</span>
    </div>
  );
};