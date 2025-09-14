import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface FOMOOrder {
  id: string;
  customer_name: string;
  customer_city: string;
  created_at: string;
  product_name: string;
  product_image: string;
}

interface FOMONotificationProps {
  order: FOMOOrder;
  position: 'bottom-left' | 'bottom-right';
  textColor: string;
  backgroundColor: string;
  iconUrl?: string;
  showProductImage: boolean;
  animationStyle: 'slide-left' | 'slide-right' | 'fade';
  clickAction: 'product' | 'close' | 'none';
  onClose: () => void;
  onProductClick?: (productName: string) => void;
}

export const FOMONotification: React.FC<FOMONotificationProps> = ({
  order,
  position,
  textColor,
  backgroundColor,
  iconUrl,
  showProductImage,
  animationStyle,
  clickAction,
  onClose,
  onProductClick
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-500 ease-out';
    
    if (!isVisible) {
      switch (animationStyle) {
        case 'slide-left':
          return `${baseClasses} transform translate-y-full opacity-0`;
        case 'slide-right':
          return `${baseClasses} transform translate-y-full opacity-0`;
        case 'fade':
          return `${baseClasses} opacity-0 scale-95 translate-y-4`;
        default:
          return `${baseClasses} opacity-0 translate-y-full`;
      }
    }
    
    return `${baseClasses} transform translate-y-0 opacity-100 scale-100`;
  };

  const getPositionClasses = () => {
    const base = 'fixed z-50 bottom-4';
    return position === 'bottom-left' ? `${base} left-4` : `${base} right-4`;
  };

  const handleClick = () => {
    switch (clickAction) {
      case 'product':
        onProductClick?.(order.product_name);
        break;
      case 'close':
        onClose();
        break;
      case 'none':
      default:
        // Do nothing
        break;
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div className={`${getPositionClasses()} ${getAnimationClasses()}`}>
      <div
        className={`
          relative max-w-sm mx-auto p-4 rounded-lg shadow-lg backdrop-blur-sm
          flex items-center space-x-3 group
          ${clickAction !== 'none' ? 'cursor-pointer hover:shadow-xl' : ''}
          transition-shadow duration-200
        `}
        style={{ backgroundColor, color: textColor }}
        onClick={handleClick}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white/20 rounded p-1"
          aria-label="Close notification"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Product Image */}
        {showProductImage && (
          <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-white/10">
            {order.product_image ? (
              <img
                src={order.product_image}
                alt={order.product_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center text-xs ${order.product_image ? 'hidden' : ''}`}>
              📦
            </div>
          </div>
        )}

        {/* Custom Icon */}
        {iconUrl && !showProductImage && (
          <div className="w-6 h-6 flex-shrink-0">
            <img
              src={iconUrl}
              alt="Notification icon"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Hide if icon fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {order.customer_name} from {order.customer_city}
          </p>
          <p className="text-xs opacity-90 truncate">
            purchased {order.product_name}
          </p>
          <p className="text-xs opacity-75">
            {getTimeAgo(order.created_at)}
          </p>
        </div>

        {/* Pulse indicator */}
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="absolute inset-0 rounded-full bg-green-500 animate-ping"></div>
          <div className="absolute inset-0 rounded-full bg-green-500"></div>
        </div>
      </div>
    </div>
  );
};