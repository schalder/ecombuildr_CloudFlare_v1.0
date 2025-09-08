import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface LineHeightControlProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  defaultHeight?: string;
}

export const LineHeightControl: React.FC<LineHeightControlProps> = ({
  value,
  onChange,
  min = 1,
  max = 3,
  step = 0.1,
  defaultHeight = '1.4'
}) => {
  const currentValue = value || defaultHeight;
  const numericValue = parseFloat(currentValue.toString()) || parseFloat(defaultHeight);
  
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
    onChange(newValue.toString());
    setIsSliding(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || min;
    const clampedVal = Math.max(min, Math.min(max, val));
    setLocalValue(clampedVal);
    onChange(clampedVal.toString());
  };

  const handleInputBlur = () => {
    // Ensure the value is within bounds on blur
    const clampedVal = Math.max(min, Math.min(max, localValue));
    if (clampedVal !== localValue) {
      setLocalValue(clampedVal);
      onChange(clampedVal.toString());
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
        step={step}
        className="flex-1"
      />
      <Input
        type="number"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        min={min}
        max={max}
        step={step}
        className="w-16 h-8"
      />
      <span className="text-xs text-muted-foreground">ratio</span>
    </div>
  );
};