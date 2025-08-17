import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, startOfToday, startOfYesterday, endOfYesterday } from "date-fns";

export type DateFilterOption = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth' | 'allTime';

interface DateFilterProps {
  value: DateFilterOption;
  onChange: (value: DateFilterOption) => void;
}

const filterOptions = [
  { value: 'today' as const, label: 'Today' },
  { value: 'yesterday' as const, label: 'Yesterday' },
  { value: 'last7days' as const, label: 'Last 7 Days' },
  { value: 'thisMonth' as const, label: 'This Month' },
  { value: 'lastMonth' as const, label: 'Last Month' },
  { value: 'allTime' as const, label: 'All Time' },
];

export const getDateRange = (filter: DateFilterOption): { start: Date | null; end: Date | null } => {
  const now = new Date();
  
  switch (filter) {
    case 'today':
      return {
        start: startOfToday(),
        end: endOfDay(now)
      };
    case 'yesterday':
      return {
        start: startOfYesterday(),
        end: endOfYesterday()
      };
    case 'last7days':
      return {
        start: startOfDay(subDays(now, 6)),
        end: endOfDay(now)
      };
    case 'thisMonth':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      };
    case 'allTime':
    default:
      return { start: null, end: null };
  }
};

export function DateFilter({ value, onChange }: DateFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <CalendarIcon className="h-4 w-4 text-muted-foreground mt-2" />
      {filterOptions.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(option.value)}
          className="text-xs"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}