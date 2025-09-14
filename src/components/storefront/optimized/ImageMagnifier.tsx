import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

interface ImageMagnifierProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  zoomLevel?: number;
  magnifierSize?: number;
  className?: string;
  style?: React.CSSProperties;
  responsive?: boolean;
}

export const ImageMagnifier: React.FC<ImageMagnifierProps> = ({
  src,
  alt,
  width,
  height,
  zoomLevel = 3.5, // Optimized for performance
  magnifierSize = 200, // Lighter default size
  className = '',
  style = {},
  responsive = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [actualMagnifierSize, setActualMagnifierSize] = useState(magnifierSize);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if device supports hover (non-touch devices)
  const [supportsHover, setSupportsHover] = useState(true);
  
  // Cache container rect for performance
  const updateContainerRect = useCallback(() => {
    if (containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect());
    }
  }, []);

  // Debounced resize handler
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      updateContainerRect();
      if (responsive) {
        const screenWidth = window.innerWidth;
        if (screenWidth >= 1024) {
          setActualMagnifierSize(Math.max(magnifierSize, 240));
        } else if (screenWidth >= 768) {
          setActualMagnifierSize(Math.max(magnifierSize * 0.85, 200));
        } else {
          setActualMagnifierSize(Math.max(magnifierSize * 0.7, 160));
        }
      }
    }, 100);
  }, [magnifierSize, responsive, updateContainerRect]);

  useEffect(() => {
    // Detect touch devices and disable magnifier on them
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setSupportsHover(!isTouchDevice);
    
    // Initial setup
    updateContainerRect();
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleResize, updateContainerRect]);

  // Throttled mouse move handler using RAF
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRect || !supportsHover) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const x = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const y = ((e.clientY - containerRect.top) / containerRect.height) * 100;
      
      setMousePosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    });
  }, [containerRect, supportsHover]);

  const handleMouseEnter = useCallback(() => {
    if (supportsHover && imageLoaded) {
      updateContainerRect();
      setIsHovered(true);
    }
  }, [supportsHover, imageLoaded, updateContainerRect]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    updateContainerRect();
  }, [updateContainerRect]);

  // Optimized magnifier styles using memoization
  const magnifierStyle = useMemo((): React.CSSProperties => {
    let adjustedX = mousePosition.x;
    let adjustedY = mousePosition.y;

    // Optimize positioning calculation using cached rect
    if (containerRect) {
      const offsetX = containerRect.width * (mousePosition.x / 100);
      const offsetY = containerRect.height * (mousePosition.y / 100);
      
      const padding = actualMagnifierSize / 2 + 10;
      if (offsetX < padding) {
        adjustedX = (padding / containerRect.width) * 100;
      } else if (offsetX > containerRect.width - padding) {
        adjustedX = ((containerRect.width - padding) / containerRect.width) * 100;
      }
      
      if (offsetY < padding) {
        adjustedY = (padding / containerRect.height) * 100;
      } else if (offsetY > containerRect.height - padding) {
        adjustedY = ((containerRect.height - padding) / containerRect.height) * 100;
      }
    }

    return {
      position: 'absolute',
      width: `${actualMagnifierSize}px`,
      height: `${actualMagnifierSize}px`,
      border: '2px solid hsl(var(--primary))',
      borderRadius: '50%',
      background: `url(${src}) no-repeat`,
      backgroundSize: `${100 * zoomLevel}% ${100 * zoomLevel}%`,
      backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
      pointerEvents: 'none',
      opacity: isHovered ? 1 : 0,
      transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
      transform: 'translate(-50%, -50%)',
      zIndex: 50,
      boxShadow: '0 4px 12px hsl(var(--foreground) / 0.1)',
      willChange: 'transform, opacity',
      left: `${adjustedX}%`,
      top: `${adjustedY}%`,
    };
  }, [mousePosition, actualMagnifierSize, isHovered, src, zoomLevel, containerRect]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full object-cover transition-opacity duration-300"
        style={{ cursor: supportsHover && imageLoaded ? 'crosshair' : 'default' }}
        onLoad={handleImageLoad}
        draggable={false}
      />
      
      {/* Magnifier lens */}
      {supportsHover && imageLoaded && (
        <div style={magnifierStyle} />
      )}
      
      {/* Optional loading indicator */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
};
