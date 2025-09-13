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

interface TimerConfig {
  duration: number;
  text: string;
  backgroundColor: string;
  textColor: string;
}

interface StoredTimerData {
  endTime: number;
  config: TimerConfig;
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
      const savedData = localStorage.getItem(storageKey);
      
      const currentConfig: TimerConfig = {
        duration,
        text,
        backgroundColor,
        textColor
      };
      
      let endTime: number;
      
      if (savedData) {
        try {
          // Try to parse as new format with config
          const parsedData: StoredTimerData = JSON.parse(savedData);
          
          // Check if config has changed
          const configChanged = JSON.stringify(parsedData.config) !== JSON.stringify(currentConfig);
          
          if (configChanged || Date.now() >= parsedData.endTime) {
            // Config changed or timer expired - create new timer
            endTime = Date.now() + (duration * 60 * 1000);
            const newData: StoredTimerData = {
              endTime,
              config: currentConfig
            };
            localStorage.setItem(storageKey, JSON.stringify(newData));
          } else {
            // Use existing timer
            endTime = parsedData.endTime;
          }
        } catch {
          // Fallback for old format (just endTime as string)
          const oldEndTime = parseInt(savedData, 10);
          if (Date.now() >= oldEndTime) {
            // Old timer expired - create new one
            endTime = Date.now() + (duration * 60 * 1000);
          } else {
            // Reset old timer with new config
            endTime = Date.now() + (duration * 60 * 1000);
          }
          
          const newData: StoredTimerData = {
            endTime,
            config: currentConfig
          };
          localStorage.setItem(storageKey, JSON.stringify(newData));
        }
      } else {
        // First visit - create new timer
        endTime = Date.now() + (duration * 60 * 1000);
        const newData: StoredTimerData = {
          endTime,
          config: currentConfig
        };
        localStorage.setItem(storageKey, JSON.stringify(newData));
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
        const newData: StoredTimerData = {
          endTime: newEndTime,
          config: {
            duration,
            text,
            backgroundColor,
            textColor
          }
        };
        localStorage.setItem(`urgency_timer_${productId}`, JSON.stringify(newData));
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
    <div className={`flex flex-col items-center sm:items-start gap-3 py-2 animate-fade-in ${className}`}>
      {/* Timer text with icon */}
      <div className="flex items-center gap-2 text-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">{text}</span>
      </div>
      
      {/* Time boxes */}
      <div className="flex items-center gap-2">
        {timeLeft.hours > 0 && (
          <div className="flex flex-col items-center gap-1">
            <div 
              className="px-3 py-2 rounded-lg text-lg font-bold min-w-[3rem] text-center"
              style={{ 
                backgroundColor,
                color: textColor
              }}
            >
              {formatTime(timeLeft.hours)}
            </div>
            <span className="text-xs text-muted-foreground">Hours</span>
          </div>
        )}
        
        {timeLeft.hours > 0 && <span className="text-muted-foreground">:</span>}
        
        <div className="flex flex-col items-center gap-1">
          <div 
            className="px-3 py-2 rounded-lg text-lg font-bold min-w-[3rem] text-center"
            style={{ 
              backgroundColor,
              color: textColor
            }}
          >
            {formatTime(timeLeft.minutes)}
          </div>
          <span className="text-xs text-muted-foreground">Minutes</span>
        </div>
        
        <span className="text-muted-foreground">:</span>
        
        <div className="flex flex-col items-center gap-1">
          <div 
            className="px-3 py-2 rounded-lg text-lg font-bold min-w-[3rem] text-center"
            style={{ 
              backgroundColor,
              color: textColor
            }}
          >
            {formatTime(timeLeft.seconds)}
          </div>
          <span className="text-xs text-muted-foreground">Seconds</span>
        </div>
      </div>
    </div>
  );
};