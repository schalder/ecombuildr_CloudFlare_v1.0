import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface UrgencyTimerProps {
  productId: string;
  duration: number; // Duration in minutes
  text: string;
  backgroundColor: string;
  textColor: string;
  className?: string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export const UrgencyTimer: React.FC<UrgencyTimerProps> = ({
  productId,
  duration,
  text,
  backgroundColor,
  textColor,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const initializeTimer = () => {
      const storageKey = `urgency_timer_${productId}`;
      const savedEndTime = localStorage.getItem(storageKey);
      
      let endTime: number;
      
      if (savedEndTime) {
        endTime = parseInt(savedEndTime, 10);
        // Check if saved timer has expired
        if (Date.now() >= endTime) {
          // Reset timer for new session
          endTime = Date.now() + (duration * 60 * 1000);
          localStorage.setItem(storageKey, endTime.toString());
        }
      } else {
        // First visit - create new timer
        endTime = Date.now() + (duration * 60 * 1000);
        localStorage.setItem(storageKey, endTime.toString());
      }
      
      return endTime;
    };

    const endTime = initializeTimer();
    
    const updateTimer = () => {
      const now = Date.now();
      const difference = endTime - now;
      
      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        // Reset timer after expiry for next visit
        const newEndTime = now + (duration * 60 * 1000);
        localStorage.setItem(`urgency_timer_${productId}`, newEndTime.toString());
        return;
      }
      
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
      setIsExpired(false);
    };

    // Update immediately
    updateTimer();
    
    // Update every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [productId, duration]);

  const formatTime = (value: number): string => {
    return value.toString().padStart(2, '0');
  };

  if (isExpired) {
    return null; // Timer will reset on next page load
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-lg border shadow-sm animate-fade-in ${className}`}
      style={{ 
        backgroundColor,
        color: textColor,
        borderColor: backgroundColor
      }}
    >
      {/* Background gradient overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${textColor}00, ${textColor}40)`
        }}
      />
      
      <div className="relative p-4">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock 
              className="w-4 h-4 animate-pulse" 
              style={{ color: textColor }}
            />
            <span className="text-sm font-medium">{text}</span>
          </div>
          
          <div className="flex items-center gap-1 text-lg font-bold">
            {timeLeft.hours > 0 && (
              <>
                <div className="bg-black/20 px-2 py-1 rounded text-center min-w-[2.5rem]">
                  {formatTime(timeLeft.hours)}
                </div>
                <span className="text-sm">:</span>
              </>
            )}
            <div className="bg-black/20 px-2 py-1 rounded text-center min-w-[2.5rem]">
              {formatTime(timeLeft.minutes)}
            </div>
            <span className="text-sm">:</span>
            <div className="bg-black/20 px-2 py-1 rounded text-center min-w-[2.5rem]">
              {formatTime(timeLeft.seconds)}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-1 text-xs mt-2 opacity-90">
          {timeLeft.hours > 0 && <span>Hours</span>}
          <span>Minutes</span>
          <span>Seconds</span>
        </div>
      </div>
      
      {/* Pulse animation border */}
      <div 
        className="absolute inset-0 rounded-lg animate-pulse"
        style={{
          boxShadow: `0 0 0 1px ${backgroundColor}40`
        }}
      />
    </div>
  );
};