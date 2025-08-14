import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Check } from 'lucide-react';
import { format, addDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, subDays, eachDayOfInterval, isAfter } from 'date-fns';
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
  const [fromDate, setFromDate] = React.useState<string>(
    value?.from ? format(value.from, 'yyyy-MM-dd') : ''
  );
  const [toDate, setToDate] = React.useState<string>(
    value?.to ? format(value.to, 'yyyy-MM-dd') : ''
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

  const handleFromDateChange = (dateString: string) => {
    setFromDate(dateString);
    const fromDateObj = new Date(dateString);
    
    if (toDate && fromDateObj <= new Date(toDate)) {
      onChange({
        from: startOfDay(fromDateObj),
        to: endOfDay(new Date(toDate)),
        preset: 'custom',
        label: `${format(fromDateObj, 'MMM d')} - ${format(new Date(toDate), 'MMM d')}`,
      });
    } else if (toDate && fromDateObj > new Date(toDate)) {
      // If from date is after to date, reset to date
      setToDate('');
    }
  };

  const handleToDateChange = (dateString: string) => {
    setToDate(dateString);
    const toDateObj = new Date(dateString);
    
    if (fromDate && new Date(fromDate) <= toDateObj) {
      onChange({
        from: startOfDay(new Date(fromDate)),
        to: endOfDay(toDateObj),
        preset: 'custom',
        label: `${format(new Date(fromDate), 'MMM d')} - ${format(toDateObj, 'MMM d')}`,
      });
      setIsOpen(false);
    }
  };

  // Generate date options for the last year and next 30 days
  const generateDateOptions = () => {
    const today = new Date();
    const startDate = subDays(today, 365);
    const endDate = addDays(today, 30);
    
    return eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'MMM d, yyyy'),
      date: date
    }));
  };

  const dateOptions = generateDateOptions();
  const availableToDateOptions = fromDate 
    ? dateOptions.filter(option => option.date >= new Date(fromDate))
    : dateOptions;

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
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">From Date</label>
                  <Select value={fromDate} onValueChange={handleFromDateChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select start date" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {dateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">To Date</label>
                  <Select 
                    value={toDate} 
                    onValueChange={handleToDateChange}
                    disabled={!fromDate}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={fromDate ? "Select end date" : "Select start date first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {availableToDateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {fromDate && toDate && (
                  <div className="mt-3 p-2 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Selected range: <span className="font-medium text-foreground">
                        {format(new Date(fromDate), 'MMM d')} - {format(new Date(toDate), 'MMM d')}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}