import React from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResponsiveControlsProps {
  deviceType: 'desktop' | 'tablet' | 'mobile';
  onDeviceChange: (device: 'desktop' | 'tablet' | 'mobile') => void;
  className?: string;
}

export const ResponsiveControls: React.FC<ResponsiveControlsProps> = ({
  deviceType,
  onDeviceChange,
  className
}) => {
  const devices = [
    { type: 'desktop' as const, icon: Monitor, label: 'Desktop' },
    { type: 'tablet' as const, icon: Tablet, label: 'Tablet' },
    { type: 'mobile' as const, icon: Smartphone, label: 'Mobile' }
  ];

  return (
    <div className={cn("flex items-center space-x-1 border border-border rounded-md p-1", className)}>
      {devices.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          size="sm"
          variant="ghost"
          className={cn(
            'h-8 px-3',
            deviceType === type && 'bg-primary text-primary-foreground'
          )}
          onClick={() => onDeviceChange(type)}
          title={`Preview ${label} view`}
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </Button>
      ))}
    </div>
  );
};