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
        className="space-y-2"
      >
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <RadioGroupItem value={option.id} id={option.id} />
            <Label 
              htmlFor={option.id} 
              className="flex-1 text-sm cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {option.type === 'area' && '📍 '}
                  {option.type === 'city' && '🏙️ '}
                  {option.type === 'rest_of_country' && '🌍 '}
                  {option.label.replace(/\(₹\d+\)/, '').trim()}
                </span>
                <span className="font-medium text-primary">
                  {option.fee === 0 ? 'Free' : formatCurrency(option.fee)}
                </span>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};