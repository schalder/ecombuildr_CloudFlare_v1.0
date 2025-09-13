import React, { useState, useRef, useEffect } from 'react';

interface ImageMagnifierProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  zoomLevel?: number;
  magnifierSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ImageMagnifier: React.FC<ImageMagnifierProps> = ({
  src,
  alt,
  width,
  height,
  zoomLevel = 2.5,
  magnifierSize = 150,
  className = '',
  style = {}
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if device supports hover (non-touch devices)
  const [supportsHover, setSupportsHover] = useState(true);
  
  useEffect(() => {
    // Detect touch devices and disable magnifier on them
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setSupportsHover(!isTouchDevice);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !supportsHover) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    if (supportsHover && imageLoaded) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Calculate magnifier styles
  const magnifierStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${magnifierSize}px`,
    height: `${magnifierSize}px`,
    border: '2px solid hsl(var(--border))',
    borderRadius: '50%',
    background: `url(${src}) no-repeat`,
    backgroundSize: `${100 * zoomLevel}% ${100 * zoomLevel}%`,
    backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
    pointerEvents: 'none',
    opacity: isHovered ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    transform: 'translate(-50%, -50%)',
    zIndex: 50,
    boxShadow: '0 4px 12px hsl(var(--background) / 0.3)',
    // Position the magnifier offset from cursor
    left: `${mousePosition.x}%`,
    top: `${mousePosition.y}%`,
  };

  // Adjust magnifier position to stay within bounds
  if (containerRef.current) {
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = rect.width * (mousePosition.x / 100);
    const offsetY = rect.height * (mousePosition.y / 100);
    
    // Keep magnifier within container bounds
    const padding = magnifierSize / 2 + 10;
    if (offsetX < padding) {
      magnifierStyle.left = `${(padding / rect.width) * 100}%`;
    } else if (offsetX > rect.width - padding) {
      magnifierStyle.left = `${((rect.width - padding) / rect.width) * 100}%`;
    }
    
    if (offsetY < padding) {
      magnifierStyle.top = `${(padding / rect.height) * 100}%`;
    } else if (offsetY > rect.height - padding) {
      magnifierStyle.top = `${((rect.height - padding) / rect.height) * 100}%`;
    }
  }

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
