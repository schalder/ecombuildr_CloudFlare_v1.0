import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Check } from 'lucide-react';
import { format, addDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

export type DateRangePreset = 
  | 'today' 
  | 'yesterday' 
  | 'last7days' 
  | 'last15days' 
  | 'currentMonth' 
  | 'lastMonth' 
  | 'last3months'
  | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
  preset: DateRangePreset;
  label: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESETS: Array<{ key: DateRangePreset; label: string; getValue: () => { from: Date; to: Date } }> = [
  {
    key: 'today',
    label: 'Today',
    getValue: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    key: 'yesterday',
    label: 'Yesterday',
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    key: 'last7days',
    label: 'Last 7 days',
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    key: 'last15days',
    label: 'Last 15 days',
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 14)),
      to: endOfDay(new Date()),
    }),
  },
  {
    key: 'currentMonth',
    label: 'Current Month',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    key: 'lastMonth',
    label: 'Last Month',
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    key: 'last3months',
    label: 'Last 3 Months',
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 90)),
      to: endOfDay(new Date()),
    }),
  },
];

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    const range = preset.getValue();
    onChange({
      from: range.from,
      to: range.to,
      preset: preset.key,
      label: preset.label,
    });
    setIsOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? value.label : "Select date range"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="border-r p-3 space-y-1">
              <div className="text-sm font-medium mb-2">Quick Select</div>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.key}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    value.preset === preset.key && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handlePresetSelect(preset)}
                >
                  {value.preset === preset.key && (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="p-3">
              <div className="text-sm font-medium mb-2">Custom Range</div>
              <Calendar
                mode="range"
                selected={{ from: value.from, to: value.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    onChange({
                      from: range.from,
                      to: range.to,
                      preset: 'custom',
                      label: `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d')}`,
                    });
                    setIsOpen(false);
                  }
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}