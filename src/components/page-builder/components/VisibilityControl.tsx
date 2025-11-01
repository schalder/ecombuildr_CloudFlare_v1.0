import React from 'react';
import { Monitor, Tablet, Smartphone, Check } from 'lucide-react';
import { ElementVisibility } from '../types';
import { CollapsibleGroup } from './ElementStyles/_shared/CollapsibleGroup';

interface VisibilityControlProps {
  visibility: ElementVisibility;
  onVisibilityChange: (visibility: ElementVisibility) => void;
}

export const VisibilityControl: React.FC<VisibilityControlProps> = ({
  visibility,
  onVisibilityChange
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleDeviceToggle = (device: keyof ElementVisibility) => {
    const newVisibility = {
      ...visibility,
      [device]: !visibility[device]
    };
    onVisibilityChange(newVisibility);
  };

  const devices = [
    {
      key: 'desktop' as keyof ElementVisibility,
      label: 'Desktop',
      icon: Monitor,
      description: 'Show on desktop devices'
    },
    {
      key: 'tablet' as keyof ElementVisibility,
      label: 'Tablet',
      icon: Tablet,
      description: 'Show on tablet devices'
    },
    {
      key: 'mobile' as keyof ElementVisibility,
      label: 'Mobile',
      icon: Smartphone,
      description: 'Show on mobile devices'
    }
  ];

  return (
    <CollapsibleGroup 
      title="Visibility" 
      isOpen={isOpen} 
      onToggle={setIsOpen}
    >
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Control which devices this element is visible on
        </p>
        
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {devices.map((device) => {
            const Icon = device.icon;
            const isVisible = visibility[device.key];
            
            return (
              <button
                key={device.key}
                onClick={() => handleDeviceToggle(device.key)}
                className={`
                  relative flex items-center justify-center h-8 px-2 rounded transition-all duration-200
                  ${isVisible 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-transparent hover:bg-muted'
                  }
                `}
                title={device.description}
              >
                {/* Check indicator - smaller, positioned inside */}
                {isVisible && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center border border-background">
                    <Check className="w-1.5 h-1.5 text-white" />
                  </div>
                )}
                
                {/* Device icon - compact size */}
                <Icon className="h-3 w-3" />
                <span className="sr-only">{device.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Summary */}
        <div className="text-xs text-muted-foreground">
          {Object.values(visibility).every(Boolean) 
            ? 'Visible on all devices'
            : Object.values(visibility).some(Boolean)
            ? `Visible on ${Object.entries(visibility).filter(([_, visible]) => visible).map(([device]) => device).join(', ')}`
            : 'Hidden on all devices'
          }
        </div>
      </div>
    </CollapsibleGroup>
  );
};
