import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ date, onDateChange, placeholder = "Pick a date", className }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(date?.getMonth() || new Date().getMonth());
  const [currentYear, setCurrentYear] = React.useState(date?.getFullYear() || new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onDateChange?.(newDate);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = date && 
        date.getDate() === day && 
        date.getMonth() === currentMonth && 
        date.getFullYear() === currentYear;
      
      const isToday = new Date().getDate() === day && 
        new Date().getMonth() === currentMonth && 
        new Date().getFullYear() === currentYear;

      days.push(
        <Button
          key={day}
          variant="ghost"
          size="sm"
          className={cn(
            "w-8 h-8 p-0 font-normal hover:bg-accent",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary",
            isToday && !isSelected && "bg-accent font-semibold"
          )}
          onClick={() => handleDateSelect(day)}
        >
          {day}
        </Button>
      );
    }

    return days;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-background border border-border shadow-lg rounded-lg" align="start">
        <div className="p-4 space-y-4">
          {/* Month and Year Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="font-semibold">
              {months[currentMonth]} {currentYear}
            </div>
            
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="w-8 h-6 text-xs font-medium text-muted-foreground flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Date Grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarGrid()}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today.getMonth());
                setCurrentYear(today.getFullYear());
                onDateChange?.(today);
                setIsOpen(false);
              }}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                onDateChange?.(undefined);
                setIsOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}