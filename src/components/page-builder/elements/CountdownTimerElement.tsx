import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { PageBuilderElement } from '../types';
import { getEffectiveResponsiveValue } from '../utils/responsiveHelpers';
import { renderElementStyles } from '../utils/styleRenderer';

interface CountdownTimerElementProps {
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimerElement: React.FC<CountdownTimerElementProps> = ({ 
  element, 
  isEditing, 
  deviceType = 'desktop',
  onUpdate 
}) => {
  const mode = element.content.mode || 'evergreen';
  const duration = element.content.duration || { days: 0, hours: 0, minutes: 30, seconds: 0 };
  const targetDate = element.content.targetDate;
  const redirectUrl = element.content.redirectUrl || '';
  const redirectType = element.content.redirectType || 'url';
  const pageSlug = element.content.pageSlug || '';
  const target = element.content.target || '_self';
  const layout = element.content.layout || 'boxes';
  const separator = element.content.separator || ':';
  const alignment = element.content.alignment || 'center';
  const showLabels = element.content.showLabels !== false;
  const labels = element.content.labels || {
    days: 'Days',
    hours: 'Hours', 
    minutes: 'Minutes',
    seconds: 'Seconds'
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    let targetTime: number;

    if (mode === 'evergreen') {
      const storageKey = `countdown-${element.id}-start`;
      let startTime = localStorage.getItem(storageKey);
      
      if (!startTime) {
        startTime = Date.now().toString();
        localStorage.setItem(storageKey, startTime);
      }
      
      const totalMs = (duration.days * 24 * 60 * 60 + duration.hours * 60 * 60 + duration.minutes * 60 + duration.seconds) * 1000;
      targetTime = parseInt(startTime) + totalMs;
    } else if (mode === 'fixed') {
      const totalMs = (duration.days * 24 * 60 * 60 + duration.hours * 60 * 60 + duration.minutes * 60 + duration.seconds) * 1000;
      targetTime = Date.now() + totalMs;
    } else if (mode === 'date' && targetDate) {
      targetTime = new Date(targetDate).getTime();
    } else {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const difference = targetTime - Date.now();
    
    if (difference <= 0) {
      if (mode === 'evergreen') {
        // Reset evergreen timer
        localStorage.removeItem(`countdown-${element.id}-start`);
        return calculateTimeLeft();
      } else {
        setExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }, [mode, duration, targetDate, element.id]);

  useEffect(() => {
    if (isEditing) return; // Don't run timer in edit mode

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(interval);
  }, [calculateTimeLeft, isEditing]);

  useEffect(() => {
    if (expired && !isEditing && (mode === 'fixed' || mode === 'date')) {
      // Handle redirect
      if (redirectType === 'url' && redirectUrl) {
        window.open(redirectUrl, target);
      } else if (redirectType === 'page' && pageSlug) {
        const url = pageSlug === 'home' ? '/' : `/${pageSlug}`;
        if (target === '_blank') {
          window.open(url, '_blank');
        } else {
          window.location.href = url;
        }
      }
    }
  }, [expired, isEditing, mode, redirectType, redirectUrl, pageSlug, target]);

  const getLayoutClasses = () => {
    const alignmentClass = alignment === 'left' ? 'justify-start' : 
                          alignment === 'right' ? 'justify-end' : 'justify-center';
    
    switch (layout) {
      case 'inline':
        return `flex items-center ${alignmentClass} text-center`;
      case 'pill':
        return `flex items-center ${alignmentClass} text-center`;
      case 'stacked':
        return `grid grid-cols-4 text-center`;
      default: // boxes
        return `flex items-center ${alignmentClass} text-center`;
    }
  };

  const getSegmentStyles = () => {
    const fontSize = getEffectiveResponsiveValue(element, 'numberFontSize', deviceType, '24px');
    const color = getEffectiveResponsiveValue(element, 'numberColor', deviceType, 'hsl(var(--primary-foreground))');
    const backgroundColor = getEffectiveResponsiveValue(element, 'numberBackgroundColor', deviceType, 'hsl(var(--primary))');
    const padding = getEffectiveResponsiveValue(element, 'segmentPadding', deviceType, '12px');
    const borderRadius = getEffectiveResponsiveValue(element, 'segmentBorderRadius', deviceType, '8px');
    const borderWidth = getEffectiveResponsiveValue(element, 'segmentBorderWidth', deviceType, '0px');
    const borderColor = getEffectiveResponsiveValue(element, 'segmentBorderColor', deviceType, 'hsl(var(--border))');
    
    return {
      fontSize,
      color,
      backgroundColor,
      padding,
      borderRadius,
      border: borderWidth && borderWidth !== '0px' 
        ? `${borderWidth} solid ${borderColor}`
        : 'none',
      minWidth: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold'
    };
  };

  const getLabelStyles = () => {
    const fontSize = getEffectiveResponsiveValue(element, 'labelFontSize', deviceType, '12px');
    const color = getEffectiveResponsiveValue(element, 'labelColor', deviceType, 'hsl(var(--muted-foreground))');
    
    return {
      fontSize,
      color,
      marginTop: '4px',
      opacity: '0.8'
    };
  };

  const getContainerStyles = () => {
    const gap = getEffectiveResponsiveValue(element, 'segmentGap', deviceType, '16px');
    
    return {
      gap
    };
  };

  const renderTimeSegment = (value: number, label: string, showSeparator: boolean) => (
    <div key={label} className="flex items-center">
      <div className="text-center">
        <div style={getSegmentStyles()}>
          {value.toString().padStart(2, '0')}
        </div>
        {showLabels && (
          <div style={getLabelStyles()}>{label}</div>
        )}
      </div>
      {showSeparator && layout === 'inline' && (
        <span className="mx-1 font-bold text-lg">{separator}</span>
      )}
    </div>
  );

  // Use renderElementStyles for proper responsive inheritance
  const elementStyles = renderElementStyles(element, deviceType);

  if (isEditing) {
    return (
      <div className={`element-${element.id} max-w-2xl mx-auto`} style={elementStyles}>
        <div className={getLayoutClasses()} style={getContainerStyles()}>
          {renderTimeSegment(1, labels.days, false)}
          {renderTimeSegment(23, labels.hours, false)}
          {renderTimeSegment(59, labels.minutes, false)}
          {renderTimeSegment(59, labels.seconds, false)}
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className={`element-${element.id} max-w-2xl mx-auto text-center p-4`} style={elementStyles}>
        <h3 className="text-xl font-bold mb-2">Time's Up!</h3>
        <p className="text-muted-foreground">The countdown has ended.</p>
      </div>
    );
  }

  return (
      <div className={`element-${element.id} max-w-2xl mx-auto`} style={elementStyles}>
        <div className={getLayoutClasses()} style={getContainerStyles()}>
          {renderTimeSegment(timeLeft.days, labels.days, true)}
          {renderTimeSegment(timeLeft.hours, labels.hours, true)}
          {renderTimeSegment(timeLeft.minutes, labels.minutes, true)}
          {renderTimeSegment(timeLeft.seconds, labels.seconds, false)}
        </div>
      </div>
  );
};