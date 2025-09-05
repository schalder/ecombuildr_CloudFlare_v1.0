import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import whatsappIcon from '@/assets/whatsapp-icon.webp';
import messengerIcon from '@/assets/messenger-icon.svg';

interface SupportWidgetProps {
  website: any;
}

export const SupportWidget: React.FC<SupportWidgetProps> = ({ website }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  const supportSettings = website.settings?.support_widget;

  // Don't render if disabled or no settings
  if (!supportSettings?.enabled) {
    return null;
  }

  const customColor = supportSettings.color;

  // Hide on cart and checkout pages to avoid redundancy
  const hiddenRoutes = ['/cart', '/checkout'];
  const shouldHide = hiddenRoutes.some(route => location.pathname.endsWith(route));

  if (shouldHide) {
    return null;
  }

  const position = supportSettings.position || 'bottom-right';
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  // Build support options based on configuration
  const supportOptions = [];

  if (supportSettings.whatsapp?.enabled && supportSettings.whatsapp?.link) {
    supportOptions.push({
      type: 'whatsapp',
      icon: 'whatsapp',
      label: 'WhatsApp',
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        window.open(supportSettings.whatsapp.link, '_blank');
      }
    });
  }

  if (supportSettings.phone?.enabled && supportSettings.phone?.number) {
    supportOptions.push({
      type: 'phone',
      icon: Phone,
      label: 'Call',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        window.location.href = `tel:${supportSettings.phone.number}`;
      }
    });
  }

  if (supportSettings.messenger?.enabled && supportSettings.messenger?.link) {
    supportOptions.push({
      type: 'messenger',
      icon: 'messenger',
      label: 'Messenger',
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        window.open(supportSettings.messenger.link, '_blank');
      }
    });
  }

  // Don't render if no support options are available
  if (supportOptions.length === 0) {
    return null;
  }

  const handleMainButtonClick = () => {
    if (supportOptions.length === 1) {
      // If only one option, trigger it directly
      supportOptions[0].action();
    } else {
      // If multiple options, toggle expansion
      setIsExpanded(!isExpanded);
    }
  };

  const expandDirection = position === 'bottom-right' ? 'left' : 'right';
  
  return (
    <div className={cn('fixed z-60', positionClasses[position])}>
      {/* Expanded options */}
      {isExpanded && supportOptions.length > 1 && (
        <div 
          className={cn(
            'absolute bottom-0 flex gap-2 items-center',
            position === 'bottom-right' ? 'right-16' : 'left-16'
          )}
        >
          {supportOptions.map((option, index) => {
            return (
              <Button
                key={option.type}
                onClick={option.action}
                className={cn(
                  'h-12 w-12 rounded-full shadow-lg transition-all duration-200',
                  'animate-in',
                  position === 'bottom-right' ? 'slide-in-from-right-2' : 'slide-in-from-left-2',
                  option.color,
                  'p-0'
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
                aria-label={option.label}
              >
                {option.icon === 'whatsapp' ? (
                  <img src={whatsappIcon} alt="WhatsApp" className="h-6 w-6" />
                ) : option.icon === 'messenger' ? (
                  <img src={messengerIcon} alt="Messenger" className="h-6 w-6" />
                ) : (
                  <Phone className="h-5 w-5 text-white" />
                )}
              </Button>
            );
          })}
          
          {/* Close button */}
          <Button
            onClick={() => setIsExpanded(false)}
            className={cn(
              'h-12 w-12 rounded-full bg-gray-500 hover:bg-gray-600 shadow-lg transition-all duration-200',
              'animate-in',
              position === 'bottom-right' ? 'slide-in-from-right-2' : 'slide-in-from-left-2'
            )}
            style={{
              animationDelay: `${supportOptions.length * 50}ms`,
              animationFillMode: 'both'
            }}
            aria-label="Close support options"
          >
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>
      )}

      {/* Main support button */}
      <Button
        size="icon"
        onClick={handleMainButtonClick}
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-105 p-0',
          !customColor && (supportOptions.length === 1 
            ? supportOptions[0].color 
            : 'bg-primary hover:bg-primary/90')
        )}
        style={customColor ? {
          backgroundColor: customColor,
          borderColor: customColor,
        } : undefined}
        aria-label={supportOptions.length === 1 ? supportOptions[0].label : 'Support options'}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
};