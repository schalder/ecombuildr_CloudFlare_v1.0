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
        
        <div className="grid grid-cols-3 gap-2">
          {devices.map((device) => {
            const Icon = device.icon;
            const isVisible = visibility[device.key];
            
            return (
              <button
                key={device.key}
                onClick={() => handleDeviceToggle(device.key)}
                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200
                  ${isVisible 
                    ? 'border-blue-500 bg-blue-50 hover:bg-blue-100' 
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                  }
                `}
                title={device.description}
              >
                {/* Check indicator */}
                {isVisible && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                
                {/* Device icon */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors
                  ${isVisible 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  <Icon className="w-4 h-4" />
                </div>
                
                {/* Device label */}
                <span className={`
                  text-xs font-medium transition-colors
                  ${isVisible ? 'text-blue-700' : 'text-gray-600'}
                `}>
                  {device.label}
                </span>
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
