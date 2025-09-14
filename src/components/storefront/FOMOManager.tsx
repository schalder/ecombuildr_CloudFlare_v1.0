import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FOMONotification } from './FOMONotification';

interface FOMOOrder {
  id: string;
  customer_name: string;
  customer_city: string;
  created_at: string;
  product_name: string;
  product_image: string;
}

interface FOMOSettings {
  enabled: boolean;
  position: 'bottom-left' | 'bottom-right';
  textColor: string;
  backgroundColor: string;
  iconUrl?: string;
  displayDuration: number;
  delayBetween: number;
  maxRecentOrders: number;
  showProductImage: boolean;
  animationStyle: 'slide-left' | 'slide-right' | 'fade';
  clickAction: 'product' | 'close' | 'none';
}

interface FOMOManagerProps {
  websiteId: string;
  settings: FOMOSettings;
  onProductClick?: (productName: string) => void;
}

export const FOMOManager: React.FC<FOMOManagerProps> = ({
  websiteId,
  settings,
  onProductClick
}) => {
  const [orders, setOrders] = useState<FOMOOrder[]>([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recent orders for FOMO
  const fetchRecentOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-recent-orders-for-fomo', {
        body: {
          websiteId,
          limit: settings.maxRecentOrders
        }
      });

      if (error) {
        console.error('Error fetching FOMO orders:', error);
        return;
      }

      if (data?.data && Array.isArray(data.data)) {
        setOrders(data.data);
        setCurrentOrderIndex(0);
      }
    } catch (error) {
      console.error('Error fetching FOMO orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [websiteId, settings.maxRecentOrders]);

  // Initial fetch
  useEffect(() => {
    if (settings.enabled) {
      fetchRecentOrders();
    }
  }, [settings.enabled, fetchRecentOrders]);

  // Cycle through notifications
  useEffect(() => {
    if (!settings.enabled || orders.length === 0 || isLoading) {
      return;
    }

    const showNextNotification = () => {
      setShowNotification(true);

      // Hide notification after display duration
      const hideTimer = setTimeout(() => {
        setShowNotification(false);
        
        // Move to next order after animation completes
        setTimeout(() => {
          setCurrentOrderIndex((prev) => (prev + 1) % orders.length);
        }, 500); // Animation duration
      }, settings.displayDuration);

      return hideTimer;
    };

    // Start with first notification after initial delay
    const initialTimer = setTimeout(showNextNotification, 2000);

    return () => clearTimeout(initialTimer);
  }, [orders, isLoading, settings.enabled, settings.displayDuration]);

  // Set up cycling interval
  useEffect(() => {
    if (!settings.enabled || orders.length === 0 || isLoading) {
      return;
    }

    const totalCycleDuration = settings.displayDuration + settings.delayBetween + 500; // 500ms for animation
    
    const intervalId = setInterval(() => {
      setShowNotification(true);

      // Hide notification after display duration
      setTimeout(() => {
        setShowNotification(false);
        
        // Move to next order after animation completes
        setTimeout(() => {
          setCurrentOrderIndex((prev) => (prev + 1) % orders.length);
        }, 500);
      }, settings.displayDuration);
    }, totalCycleDuration);

    return () => clearInterval(intervalId);
  }, [orders, isLoading, settings.enabled, settings.displayDuration, settings.delayBetween]);

  // Refresh orders periodically
  useEffect(() => {
    if (!settings.enabled) return;

    const refreshInterval = setInterval(() => {
      fetchRecentOrders();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [settings.enabled, fetchRecentOrders]);

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  // Don't render if disabled or no orders
  if (!settings.enabled || orders.length === 0 || isLoading) {
    return null;
  }

  const currentOrder = orders[currentOrderIndex];

  return (
    <>
      {showNotification && currentOrder && (
        <FOMONotification
          order={currentOrder}
          position={settings.position}
          textColor={settings.textColor}
          backgroundColor={settings.backgroundColor}
          iconUrl={settings.iconUrl}
          showProductImage={settings.showProductImage}
          animationStyle={settings.animationStyle}
          clickAction={settings.clickAction}
          onClose={handleCloseNotification}
          onProductClick={onProductClick}
        />
      )}
    </>
  );
};