import { OptimizedImage } from './OptimizedImage';

interface CriticalImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
}

export const CriticalImage = ({ 
  src, 
  alt, 
  className, 
  width, 
  height,
  aspectRatio
}: CriticalImageProps) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      aspectRatio={aspectRatio}
      priority={true}
      loading="eager"
    />
  );
};
