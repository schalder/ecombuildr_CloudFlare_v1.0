import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [activeTab, setActiveTab] = React.useState<'presets' | 'custom'>(
    value?.preset === 'custom' ? 'custom' : 'presets'
  );

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

  const handleCustomRangeSelect = (range: any) => {
    if (range?.from && range?.to) {
      onChange({
        from: range.from,
        to: range.to,
        preset: 'custom',
        label: `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d')}`,
      });
      setIsOpen(false);
    }
  };

  // Group presets for better organization
  const todayYesterday = PRESETS.slice(0, 2);
  const weeklyOptions = PRESETS.slice(2, 4);
  const monthlyOptions = PRESETS.slice(4);

  return (
    <div className={cn("flex items-center", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[200px] sm:w-[240px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">
              {value ? value.label : "Select date range"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'presets' | 'custom')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-b-none">
              <TabsTrigger value="presets" className="text-xs sm:text-sm">Quick Select</TabsTrigger>
              <TabsTrigger value="custom" className="text-xs sm:text-sm">Custom Range</TabsTrigger>
            </TabsList>
            
            <TabsContent value="presets" className="p-3 m-0 space-y-4">
              {/* Daily Options */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground mb-2">Daily</div>
                <div className="grid grid-cols-2 gap-1">
                  {todayYesterday.map((preset) => (
                    <Button
                      key={preset.key}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "justify-start text-xs h-8",
                        value.preset === preset.key && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      {value.preset === preset.key && (
                        <Check className="mr-1 h-3 w-3" />
                      )}
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Weekly Options */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground mb-2">Weekly</div>
                <div className="space-y-1">
                  {weeklyOptions.map((preset) => (
                    <Button
                      key={preset.key}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-xs h-8",
                        value.preset === preset.key && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      {value.preset === preset.key && (
                        <Check className="mr-1 h-3 w-3" />
                      )}
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Monthly Options */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground mb-2">Monthly</div>
                <div className="space-y-1">
                  {monthlyOptions.map((preset) => (
                    <Button
                      key={preset.key}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-xs h-8",
                        value.preset === preset.key && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      {value.preset === preset.key && (
                        <Check className="mr-1 h-3 w-3" />
                      )}
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="p-0 m-0">
              <div className="p-4">
                <Calendar
                  mode="range"
                  selected={{ from: value.from, to: value.to }}
                  onSelect={handleCustomRangeSelect}
                  initialFocus
                  className="pointer-events-auto"
                />
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}