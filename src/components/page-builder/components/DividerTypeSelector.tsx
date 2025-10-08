import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { shapeDividers, dividerCategories, ShapeDividerType } from '../dividers/shapeDividers';

interface DividerTypeSelectorProps {
  value: ShapeDividerType;
  onValueChange: (value: ShapeDividerType) => void;
  placeholder?: string;
}

export const DividerTypeSelector: React.FC<DividerTypeSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Select divider type"
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(dividerCategories).map(([category, types]) => (
          <div key={category}>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {category}
            </div>
            {types.map((type) => {
              const DividerComponent = shapeDividers[type];
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 flex-shrink-0">
                      <DividerComponent 
                        color="currentColor" 
                        height={16} 
                        flip={false} 
                        invert={false}
                      />
                    </div>
                    <span className="capitalize">
                      {type.replace(/-/g, ' ')}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
};
