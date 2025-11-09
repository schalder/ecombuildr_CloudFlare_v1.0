import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { getAvailableShippingOptions, applyShippingOptionToForm } from '@/lib/shipping-enhanced';
import type { ShippingSettings, ShippingOption } from '@/lib/shipping-enhanced';
import { formatCurrency } from '@/lib/currency';

interface ShippingOptionsPickerProps {
  settings: ShippingSettings | undefined;
  selectedOptionId?: string;
  onOptionSelect: (option: ShippingOption) => void;
  setForm: (updater: (prev: any) => any) => void;
  className?: string;
}

export const ShippingOptionsPicker: React.FC<ShippingOptionsPickerProps> = ({
  settings,
  selectedOptionId,
  onOptionSelect,
  setForm,
  className = '',
}) => {
  const options = getAvailableShippingOptions(settings);

  if (options.length === 0) {
    return null;
  }

  const handleOptionSelect = (optionId: string) => {
    const option = options.find(opt => opt.id === optionId);
    if (option && settings) {
      applyShippingOptionToForm(option, settings, setForm);
      onOptionSelect(option);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <Label className="text-sm font-medium">Shipping Options</Label>
      </div>
      
      <RadioGroup
        value={selectedOptionId}
        onValueChange={handleOptionSelect}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {options.map((option) => (
          <label 
            key={option.id} 
            htmlFor={option.id}
            className="flex items-start gap-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">
                  {option.label.replace(/\(₹\d+\)/, '').trim()}
                </span>
                <span className="font-semibold text-sm text-primary">
                  {option.fee === 0 ? 'Free' : formatCurrency(option.fee)}
                </span>
              </div>
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
};