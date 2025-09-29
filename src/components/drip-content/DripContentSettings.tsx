import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, Lock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface DripContentData {
  drip_enabled: boolean;
  drip_type: 'days_after_purchase' | 'specific_date';
  drip_days: number;
  drip_release_date: string | null;
  drip_lock_message: string;
}

interface DripContentSettingsProps {
  value: DripContentData;
  onChange: (value: DripContentData) => void;
}

export function DripContentSettings({ value, onChange }: DripContentSettingsProps) {
  const handleDripEnabledChange = (enabled: boolean) => {
    onChange({
      ...value,
      drip_enabled: enabled
    });
  };

  const handleDripTypeChange = (type: 'days_after_purchase' | 'specific_date') => {
    onChange({
      ...value,
      drip_type: type
    });
  };

  const handleDripDaysChange = (days: number) => {
    onChange({
      ...value,
      drip_days: days
    });
  };

  const handleDripDateChange = (date: Date | undefined) => {
    onChange({
      ...value,
      drip_release_date: date ? date.toISOString().split('T')[0] : null
    });
  };

  const handleLockMessageChange = (message: string) => {
    onChange({
      ...value,
      drip_lock_message: message
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center space-x-2">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Drip Content Settings</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="drip-enabled"
          checked={value.drip_enabled}
          onCheckedChange={handleDripEnabledChange}
        />
        <Label htmlFor="drip-enabled">Enable drip content for this lesson</Label>
      </div>

      {value.drip_enabled && (
        <div className="space-y-4 pl-6 border-l-2 border-muted">
          <div className="space-y-2">
            <Label className="text-sm">Release Type</Label>
            <Select value={value.drip_type} onValueChange={handleDripTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days_after_purchase">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Days after course purchase</span>
                  </div>
                </SelectItem>
                <SelectItem value="specific_date">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Specific date</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {value.drip_type === 'days_after_purchase' && (
            <div className="space-y-2">
              <Label htmlFor="drip-days" className="text-sm">
                Days after purchase
              </Label>
              <Input
                id="drip-days"
                type="number"
                min="0"
                value={value.drip_days}
                onChange={(e) => handleDripDaysChange(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Lesson will be available {value.drip_days} days after course purchase
              </p>
            </div>
          )}

          {value.drip_type === 'specific_date' && (
            <div className="space-y-2">
              <Label className="text-sm">Release Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !value.drip_release_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value.drip_release_date ? (
                      format(new Date(value.drip_release_date), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border border-border shadow-lg rounded-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={value.drip_release_date ? new Date(value.drip_release_date) : undefined}
                    onSelect={handleDripDateChange}
                    initialFocus
                    className="pointer-events-auto rounded-lg"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="lock-message" className="text-sm">
              Lock Message
            </Label>
            <Textarea
              id="lock-message"
              value={value.drip_lock_message}
              onChange={(e) => handleLockMessageChange(e.target.value)}
              placeholder="This lesson will be available after you complete the prerequisites."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Message shown to students when the lesson is locked
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
