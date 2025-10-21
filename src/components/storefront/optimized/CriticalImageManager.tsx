import React, { createContext, useContext, useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '@/lib/imageOptimization';

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
      // Skip if not a Supabase image
      if (!src.includes('fhqwacmokbtbspkxjixf.supabase.co')) {
        return;
      }

      // Use Cloudflare-optimized URL for preload
      const optimizedSrc = getOptimizedImageUrl(src, { width: 1200, quality: 90, format: 'auto' });
      const existingPreload = document.querySelector(`link[href="${optimizedSrc}"]`);
      if (existingPreload) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedSrc;
      link.setAttribute('fetchpriority', 'high');
      
      document.head.appendChild(link);
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