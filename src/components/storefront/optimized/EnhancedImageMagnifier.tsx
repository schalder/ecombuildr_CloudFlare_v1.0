import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ZoomIn, Maximize2 } from 'lucide-react';

interface EnhancedImageMagnifierProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  zoomLevel?: number;
  magnifierSize?: number;
  className?: string;
  style?: React.CSSProperties;
  responsive?: boolean;
  highResolutionSrc?: string; // Optional high-res image for zoom
  enableFullscreen?: boolean; // Enable fullscreen zoom modal
}

export const EnhancedImageMagnifier: React.FC<EnhancedImageMagnifierProps> = ({
  src,
  alt,
  width,
  height,
  zoomLevel = 6, // Higher zoom for better detail
  magnifierSize = 300, // Larger magnifier
  className = '',
  style = {},
  responsive = true,
  highResolutionSrc,
  enableFullscreen = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
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

  // Optimized responsive sizing with reduced debounce
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      updateContainerRect();
      if (responsive) {
        const screenWidth = window.innerWidth;
        if (screenWidth >= 1440) {
          setActualMagnifierSize(Math.max(magnifierSize, 350));
        } else if (screenWidth >= 1024) {
          setActualMagnifierSize(Math.max(magnifierSize, 280));
        } else if (screenWidth >= 768) {
          setActualMagnifierSize(Math.max(magnifierSize * 0.8, 220));
        } else {
          setActualMagnifierSize(Math.max(magnifierSize * 0.6, 180));
        }
      }
    }, 50); // Reduced debounce for faster responsiveness
  }, [magnifierSize, responsive, updateContainerRect]);

  useEffect(() => {
    // Enhanced touch device detection
    const isTouchDevice = 'ontouchstart' in window || 
                         navigator.maxTouchPoints > 0 || 
                         window.matchMedia('(pointer: coarse)').matches;
    setSupportsHover(!isTouchDevice);
    
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

  // Optimized mouse move handler for ultra-smooth following
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!supportsHover) return;

    // Use current rect to avoid stale closure issues
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Cancel previous frame for smoother performance
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Immediate position calculation for responsiveness
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const clampedPosition = { 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    };

    // Use RAF only for DOM updates, not position calculation
    rafRef.current = requestAnimationFrame(() => {
      setMousePosition(clampedPosition);
    });
  }, [supportsHover]);

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

  const handleFullscreenToggle = useCallback(() => {
    setShowFullscreen(!showFullscreen);
  }, [showFullscreen]);

  // Enhanced magnifier positioning with smart edge detection
  const magnifierPosition = useMemo(() => {
    if (!containerRect) return { x: 50, y: 50 };

    const offsetX = containerRect.width * (mousePosition.x / 100);
    const offsetY = containerRect.height * (mousePosition.y / 100);
    
    const buffer = actualMagnifierSize / 2 + 20; // Enhanced buffer
    let adjustedX = mousePosition.x;
    let adjustedY = mousePosition.y;

    // Smart positioning to keep magnifier in view
    if (offsetX < buffer) {
      adjustedX = (buffer / containerRect.width) * 100;
    } else if (offsetX > containerRect.width - buffer) {
      adjustedX = ((containerRect.width - buffer) / containerRect.width) * 100;
    }
    
    if (offsetY < buffer) {
      adjustedY = (buffer / containerRect.height) * 100;
    } else if (offsetY > containerRect.height - buffer) {
      adjustedY = ((containerRect.height - buffer) / containerRect.height) * 100;
    }

    return { x: adjustedX, y: adjustedY };
  }, [mousePosition, actualMagnifierSize, containerRect]);

  // Ultra-smooth magnifier styles optimized for performance
  const magnifierStyle = useMemo((): React.CSSProperties => {
    const zoomSrc = highResolutionSrc || src;
    
    return {
      position: 'absolute',
      width: `${actualMagnifierSize}px`,
      height: `${actualMagnifierSize}px`,
      border: '3px solid hsl(var(--background))',
      borderRadius: '50%',
      background: `url(${zoomSrc}) no-repeat`,
      backgroundSize: `${100 * zoomLevel}% ${100 * zoomLevel}%`,
      backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
      pointerEvents: 'none',
      opacity: isHovered ? 1 : 0,
      // Removed transform transition for smoother cursor following
      transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
      transform: `translate(-50%, -50%) scale(${isHovered ? 1 : 0.8})`,
      zIndex: 100,
      boxShadow: `
        0 0 0 2px hsl(var(--primary) / 0.5),
        0 20px 40px -10px hsl(var(--foreground) / 0.2),
        0 10px 20px -5px hsl(var(--foreground) / 0.1),
        inset 0 0 0 1px hsl(var(--background) / 0.8)
      `,
      // Optimized for smooth movement
      willChange: 'transform, opacity, background-position',
      left: `${magnifierPosition.x}%`,
      top: `${magnifierPosition.y}%`,
      backdropFilter: 'blur(1px)',
      // Hardware acceleration for smoother performance
      backfaceVisibility: 'hidden',
    };
  }, [mousePosition, magnifierPosition, actualMagnifierSize, isHovered, src, highResolutionSrc, zoomLevel]);

  // Fullscreen modal styles
  const fullscreenStyle = useMemo((): React.CSSProperties => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'hsl(var(--background) / 0.95)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    opacity: showFullscreen ? 1 : 0,
    visibility: showFullscreen ? 'visible' : 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }), [showFullscreen]);

  return (
    <>
      <div
        ref={containerRef}
        className={`relative overflow-hidden group ${className}`}
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
          className="w-full h-full object-cover transition-all duration-300"
          style={{ 
            cursor: supportsHover && imageLoaded ? 'zoom-in' : 'default',
            filter: isHovered ? 'brightness(1.05)' : 'brightness(1)',
          }}
          onLoad={handleImageLoad}
          onClick={enableFullscreen ? handleFullscreenToggle : undefined}
          draggable={false}
        />
        
        {/* Enhanced magnifier lens */}
        {supportsHover && imageLoaded && (
          <div style={magnifierStyle}>
            {/* Inner lens highlight */}
            <div
              className="absolute inset-2 rounded-full"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--background) / 0.1), transparent 50%, hsl(var(--background) / 0.1))',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}
        
        {/* Zoom indicators */}
        {imageLoaded && (
          <>
            {/* Hover indicator */}
            <div className={`absolute top-4 right-4 transition-all duration-300 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}>
              <div className="bg-background/90 backdrop-blur-sm border border-border rounded-full p-2">
                <ZoomIn size={16} className="text-muted-foreground" />
              </div>
            </div>
            
            {/* Fullscreen button */}
            {enableFullscreen && (
              <button
                onClick={handleFullscreenToggle}
                className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border border-border rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-110"
                aria-label="View fullscreen"
              >
                <Maximize2 size={16} className="text-muted-foreground" />
              </button>
            )}
          </>
        )}
        
        {/* Loading indicator */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      {enableFullscreen && (
        <div style={fullscreenStyle} onClick={handleFullscreenToggle}>
          <div 
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={highResolutionSrc || src}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              draggable={false}
            />
            <button
              onClick={handleFullscreenToggle}
              className="absolute -top-12 right-0 bg-background/90 backdrop-blur-sm border border-border rounded-full p-2 hover:bg-background transition-colors"
              aria-label="Close fullscreen"
            >
              <ZoomIn size={20} className="text-muted-foreground rotate-180" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
