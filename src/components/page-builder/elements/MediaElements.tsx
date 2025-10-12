import React, { useState, useEffect } from 'react';
import { Image, Video, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';
import { InlineEditor } from '../components/InlineEditor';
import { renderElementStyles } from '../utils/styleRenderer';
import { getEffectiveResponsiveValue } from '../utils/responsiveHelpers';

// Image Gallery Element
const ImageGalleryElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const images = element.content.images || [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop'
  ];

  const columns = element.content.columns || 3;
  const gap = element.content.gap || 'md';
  const aspectRatio = element.content.aspectRatio || 'square';
  const showLightbox = element.content.showLightbox !== false;

  const getColumnsClass = () => {
    switch (columns) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-2 md:grid-cols-3';
      case 4: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      case 5: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
      case 6: return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6';
      default: return 'grid-cols-2 md:grid-cols-3';
    }
  };

  const getGapClass = () => {
    switch (gap) {
      case 'sm': return 'gap-2';
      case 'md': return 'gap-4';
      case 'lg': return 'gap-6';
      case 'xl': return 'gap-8';
      default: return 'gap-4';
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square';
      case 'landscape': return 'aspect-video';
      case 'portrait': return 'aspect-[3/4]';
      case 'auto': return '';
      default: return 'aspect-square';
    }
  };

  return (
    <div className="max-w-4xl mx-auto" style={element.styles}>
      <div className={`grid ${getColumnsClass()} ${getGapClass()}`}>
        {images.map((image: string, index: number) => {
          if (!image) return null;
          
          const imageElement = (
            <div className="cursor-pointer">
              <img
                src={image}
                alt={`Gallery image ${index + 1}`}
                className={`w-full object-cover rounded-lg ${getAspectRatioClass()}`}
              />
            </div>
          );

          if (!showLightbox) {
            return <div key={index}>{imageElement}</div>;
          }

          return (
            <Dialog key={index}>
              <DialogTrigger asChild>
                {imageElement}
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <img
                  src={image}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-auto"
                />
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </div>
  );
};

// Image Carousel Element
const ImageCarouselElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, deviceType = 'desktop', onUpdate }) => {
  const images = element.content.images || [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&h=400&fit=crop'
  ];

  const autoPlay = element.content.autoPlay || false;
  const autoPlayDelay = element.content.autoPlayDelay || 3000;
  const showArrows = element.content.showArrows !== false;
  const showDots = element.content.showDots !== false;
  const height = element.content.height || 384;
  const imageFit = element.content.imageFit || 'cover';
  
  // Get visibleImages with device-aware support from content
  const visibleImagesByDevice = element.content.visibleImagesByDevice || { desktop: 1, tablet: 1, mobile: 1 };
  const visibleImages = visibleImagesByDevice[deviceType] || 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentIndex(api.selectedScrollSnap());
    api.on('select', onSelect);
    onSelect();
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || !autoPlay || images.length <= 1) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, autoPlayDelay);
    return () => clearInterval(interval);
  }, [api, autoPlay, autoPlayDelay, images.length]);

  const handleTitleUpdate = (newTitle: string) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...element.content,
          title: newTitle
        }
      });
    }
  };

  // Get grid class based on visibleImages for layout
  const getGridClass = (count: number) => {
    switch (count) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      case 4: return 'grid-cols-4';
      default: return 'grid-cols-1';
    }
  };

  return (
    <div 
      className="max-w-4xl mx-auto" 
      style={renderElementStyles(element, deviceType)}
    >
      <div className="relative">
        <Carousel className="w-full" setApi={setApi} opts={{ loop: true }}>
          <CarouselContent>
            {images.map((image: string, imageIndex: number) => {
              if (!image) return null;
              return (
                <CarouselItem key={imageIndex}>
                  <div className={`grid gap-1 ${getGridClass(visibleImages)}`}>
                    {/* Show current image and next visibleImages-1 images */}
                    {Array.from({ length: visibleImages }, (_, i) => {
                      const currentImageIndex = imageIndex + i;
                      const currentImage = images[currentImageIndex];
                      if (!currentImage) return null;
                      
                      return (
                        <div key={i} className="p-1">
                          <img
                            src={currentImage}
                            alt={`Carousel image ${currentImageIndex + 1}`}
                            className="w-full"
                            style={{
                              height: `${height}px`,
                              objectFit: imageFit as 'cover' | 'contain',
                              borderRadius: 'inherit'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          {showArrows && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}
        </Carousel>
        
        {showDots && images.length > visibleImages && (
          <div className="flex justify-center mt-4 space-x-2">
            {images.map((_, imageIndex) => (
              <button
                key={imageIndex}
                className={`w-2 h-2 rounded-full transition-colors ${
                  imageIndex === currentIndex ? 'bg-primary' : 'bg-primary/30'
                }`}
                onClick={() => api?.scrollTo(imageIndex)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Video Playlist Element
const VideoPlaylistElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, deviceType = 'desktop', onUpdate }) => {
  const videos = element.content.videos || [
    {
      title: 'Sample Video 1',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300&h=200&fit=crop'
    },
    {
      title: 'Sample Video 2',
      url: 'https://www.w3schools.com/html/movie.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=300&h=200&fit=crop'
    }
  ];

  const autoPlay = element.content.autoPlay || false;
  const showControls = element.content.showControls !== false;
  const muted = element.content.muted || false;

  const validVideos = videos.filter((video: any) => video.url);
  const [currentVideo, setCurrentVideo] = useState(validVideos[0] || videos[0]);

  // Extract button styling properties
  const buttonFontSize = element.content.buttonFontSize || 14;
  const buttonFontWeight = element.content.buttonFontWeight || '400';
  const buttonFontColor = element.content.buttonFontColor || '#ffffff';
  const buttonBackgroundColor = element.content.buttonBackgroundColor || '#000000';
  const buttonHoverBackground = element.content.buttonHoverBackground || '#333333';
  const buttonActiveBackground = element.content.buttonActiveBackground || '#0066cc';
  const buttonPadding = element.content.buttonPadding || 8;
  const buttonBorderRadius = element.content.buttonBorderRadius || 4;
  const buttonGap = element.content.buttonGap || 8;

  // Generate button styles CSS
  const buttonStyles = `
    .playlist-button-${element.id} {
      font-size: ${buttonFontSize}px !important;
      font-weight: ${buttonFontWeight} !important;
      color: ${buttonFontColor} !important;
      background-color: ${buttonBackgroundColor} !important;
      padding: ${buttonPadding}px !important;
      border-radius: ${buttonBorderRadius}px !important;
      border: none !important;
      transition: background-color 0.2s ease !important;
    }
    .playlist-button-${element.id}:hover {
      background-color: ${buttonHoverBackground} !important;
    }
    .playlist-button-${element.id}.active {
      background-color: ${buttonActiveBackground} !important;
    }
  `;

  // Get device-aware styles
  const containerStyles = renderElementStyles(element, deviceType);
  
  // Get effective width for responsive behavior
  const effectiveWidth = getEffectiveResponsiveValue(element, 'width', deviceType, '100%');
  
  
  // Generate dynamic CSS for responsive width
  const dynamicStyles = `
    .video-playlist-container-${element.id} {
      width: ${effectiveWidth} !important;
      max-width: ${effectiveWidth === '100%' ? '100%' : effectiveWidth} !important;
      margin: 0 auto !important;
    }
    ${buttonStyles}
  `;

  if (!currentVideo) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
        <div 
          className={`video-playlist-container-${element.id}`} 
          style={containerStyles}
        >
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">No videos available</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      <div 
        className={`video-playlist-container-${element.id}`} 
        style={containerStyles}
      >
        <div className="grid md:grid-cols-3 gap-4 w-full">
        <div className="md:col-span-2">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              key={currentVideo.url}
              controls={showControls}
              autoPlay={autoPlay}
              muted={muted}
              className="w-full h-full"
              poster={currentVideo.thumbnail}
            >
              <source src={currentVideo.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <h4 className="text-lg font-semibold mt-2">{currentVideo.title}</h4>
        </div>
        <div className="space-y-2">
          <h5 className="font-medium">Playlist ({validVideos.length})</h5>
          <div 
            className="max-h-60 overflow-y-auto"
            style={{ gap: `${buttonGap}px`, display: 'flex', flexDirection: 'column' }}
          >
            {validVideos.map((video: any, index: number) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className={`w-full justify-start playlist-button-${element.id} ${
                  currentVideo.url === video.url ? 'active' : ''
                }`}
                onClick={() => setCurrentVideo(video)}
              >
                <Play className="h-4 w-4 mr-2" />
                <span className="truncate">{video.title}</span>
              </Button>
            ))}
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

// Register Media Elements
export const registerMediaElements = () => {
  elementRegistry.register({
    id: 'image-gallery',
    name: 'Image Gallery',
    category: 'media',
    icon: Image,
    component: ImageGalleryElement,
    defaultContent: {
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop'
      ]
    },
    description: 'Multiple images in gallery layout'
  });

  elementRegistry.register({
    id: 'image-carousel',
    name: 'Image Carousel',
    category: 'media',
    icon: Image,
    component: ImageCarouselElement,
    defaultContent: {
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&h=400&fit=crop'
      ],
      visibleImagesByDevice: {
        desktop: 1,
        tablet: 1,
        mobile: 1
      }
    },
    description: 'Sliding image carousel'
  });

  elementRegistry.register({
    id: 'video-playlist',
    name: 'Video Playlist',
    category: 'media',
    icon: Video,
    component: VideoPlaylistElement,
    defaultContent: {
      videos: [
        {
          title: 'Sample Video 1',
          url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300&h=200&fit=crop'
        },
        {
          title: 'Sample Video 2',
          url: 'https://www.w3schools.com/html/movie.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=300&h=200&fit=crop'
        }
      ]
    },
    description: 'Multiple videos with playlist'
  });
};