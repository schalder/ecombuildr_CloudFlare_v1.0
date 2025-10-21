import React, { createContext, useContext, useState, useEffect } from 'react';

interface CriticalImageContextType {
  criticalImages: Set<string>;
  addCriticalImage: (src: string) => void;
  isCriticalImage: (src: string) => boolean;
}

const CriticalImageContext = createContext<CriticalImageContextType | null>(null);

interface CriticalImageManagerProps {
  children: React.ReactNode;
  maxCriticalImages?: number;
}

export const CriticalImageManager: React.FC<CriticalImageManagerProps> = ({
  children,
  maxCriticalImages = 3
}) => {
  const [criticalImages, setCriticalImages] = useState<Set<string>>(new Set());

  // Automatically mark first few images as critical
  const addCriticalImage = (src: string) => {
    setCriticalImages(prev => {
      if (prev.size >= maxCriticalImages) return prev;
      return new Set([...prev, src]);
    });
  };

  const isCriticalImage = (src: string) => criticalImages.has(src);

  // Preload critical images
  useEffect(() => {
    criticalImages.forEach(src => {
      // Check if elements already exist to avoid duplicates
      const existingPreload = document.querySelector(`link[href="${src}"]`);
      if (existingPreload) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.setAttribute('fetchpriority', 'high');
      
      // Add different format preloads
      const baseUrl = src.split('.').slice(0, -1).join('.');
      const extension = src.split('.').pop()?.toLowerCase();
      
      if (['jpg', 'jpeg', 'png'].includes(extension || '')) {
        // Preload WebP version if available
        const webpLink = document.createElement('link');
        webpLink.rel = 'preload';
        webpLink.as = 'image';
        webpLink.href = `${baseUrl}.webp`;
        webpLink.setAttribute('fetchpriority', 'high');
        
        const existingWebpPreload = document.querySelector(`link[href="${baseUrl}.webp"]`);
        
        document.head.appendChild(link);
        if (!existingWebpPreload) {
          document.head.appendChild(webpLink);
        }
      } else {
        document.head.appendChild(link);
      }
    });
  }, [criticalImages]);

  return (
    <CriticalImageContext.Provider 
      value={{ 
        criticalImages, 
        addCriticalImage, 
        isCriticalImage 
      }}
    >
      {children}
    </CriticalImageContext.Provider>
  );
};

export const useCriticalImage = () => {
  const context = useContext(CriticalImageContext);
  if (!context) {
    throw new Error('useCriticalImage must be used within CriticalImageManager');
  }
  return context;
};