import React, { useState, useEffect } from 'react';
import { Image, Video, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';
import { InlineEditor } from '../components/InlineEditor';
import { renderElementStyles } from '../utils/styleRenderer';
import { generateResponsiveCSS } from '../utils/responsiveStyles';

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

  return (
    <div 
      className="max-w-4xl mx-auto" 
      style={renderElementStyles(element, deviceType)}
    >
      <div className="relative">
        <Carousel className="w-full" setApi={setApi} opts={{ loop: true }}>
          <CarouselContent>
            {images.map((image: string, index: number) => {
              if (!image) return null;
              return (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <img
                      src={image}
                      alt={`Carousel image ${index + 1}`}
                      className="w-full"
                      style={{
                        height: `${height}px`,
                        objectFit: imageFit as 'cover' | 'contain',
                        borderRadius: 'inherit'
                      }}
                    />
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
        
        {showDots && images.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-primary/30'
                }`}
                onClick={() => api?.scrollTo(index)}
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
}> = ({ element, isEditing, onUpdate }) => {
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

  if (!currentVideo) {
    return (
      <div className="max-w-4xl mx-auto" style={element.styles}>
        <InlineEditor
          value={element.content.title || 'Video Playlist'}
          onChange={handleTitleUpdate}
          className="text-xl font-semibold mb-4"
          placeholder="Playlist title..."
        />
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">No videos available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" style={element.styles}>
      <InlineEditor
        value={element.content.title || 'Video Playlist'}
        onChange={handleTitleUpdate}
        className="text-xl font-semibold mb-4"
        placeholder="Playlist title..."
      />
      <div className="grid md:grid-cols-3 gap-4">
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
          <div className="max-h-60 overflow-y-auto space-y-2">
            {validVideos.map((video: any, index: number) => (
              <Button
                key={index}
                variant={currentVideo.url === video.url ? "default" : "outline"}
                size="sm"
                className="w-full justify-start"
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
  );
};

// Image Feature Element
const ImageFeatureElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType, columnCount = 1 }) => {
  const headline = element.content.headline || 'Feature Headline';
  const description = element.content.description || 'Feature description goes here...';
  const imageUrl = element.content.imageUrl || 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=500&h=300&fit=crop';
  const altText = element.content.altText || 'Feature image';
  const imagePosition = element.content.imagePosition || 'left';
  const imageWidth = element.content.imageWidth || 50;

  const handleUpdate = (property: string, value: any) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...element.content,
          [property]: value
        }
      });
    }
  };

  // Generate responsive CSS and get inline styles
  const responsiveCSS = generateResponsiveCSS(element.id, element.styles);
  const inlineStyles = renderElementStyles(element, deviceType || 'desktop');
  
  // Get responsive styles for current device
  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentStyles = (responsiveStyles as any)[deviceType || 'desktop'] || {};

  // Determine if we should stack on mobile
  const isMobile = deviceType === 'mobile';
  const flexDirection = isMobile ? 'flex-col' : (imagePosition === 'right' ? 'flex-row-reverse' : 'flex-row');
  
  const imageStyles = {
    width: isMobile ? '100%' : `${imageWidth}%`,
    minWidth: isMobile ? 'auto' : '200px',
    maxWidth: isMobile ? '100%' : '60%'
  };

  const contentStyles = {
    width: isMobile ? '100%' : `${100 - imageWidth}%`,
    flex: isMobile ? 'none' : '1'
  };

  return (
    <div
      className={`relative w-full flex gap-6 items-stretch ${flexDirection} ${isMobile ? 'space-y-4' : ''}`}
      style={inlineStyles}
    >
      <style>{responsiveCSS}</style>
      
      {/* Image */}
      <div className="flex-shrink-0" style={imageStyles}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={altText}
            className="w-full h-full object-cover rounded-lg"
            draggable={false}
            style={{ minHeight: '200px' }}
          />
        ) : (
          <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
            <Image className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center space-y-4" style={contentStyles}>
        <InlineEditor
          value={headline}
          onChange={(value) => handleUpdate('headline', value)}
          placeholder="Feature Headline"
          className="text-2xl font-bold"
          style={{
            fontSize: currentStyles.headlineFontSize || '24px',
            color: currentStyles.headlineColor || '#333333',
            fontFamily: currentStyles.headlineFontFamily || '',
            textAlign: currentStyles.headlineTextAlign || 'left',
            lineHeight: currentStyles.headlineLineHeight || '1.4'
          }}
          disabled={!isEditing}
        />
        
        <InlineEditor
          value={description}
          onChange={(value) => handleUpdate('description', value)}
          placeholder="Feature description goes here..."
          className="text-base"
          style={{
            fontSize: currentStyles.descriptionFontSize || '16px',
            color: currentStyles.descriptionColor || '#666666',
            fontFamily: currentStyles.descriptionFontFamily || '',
            textAlign: currentStyles.descriptionTextAlign || 'left',
            lineHeight: currentStyles.descriptionLineHeight || '1.6'
          }}
          disabled={!isEditing}
        />
      </div>
    </div>
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
      ]
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
      title: 'Video Playlist',
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

// Register Image Feature Element separately to ensure proper scope
elementRegistry.register({
  id: 'image-feature',
  name: 'Image Feature',
  category: 'media',
  icon: Image,
  component: ImageFeatureElement,
  defaultContent: {
    headline: 'Amazing Feature',
    description: 'This feature will help you achieve your goals faster and more efficiently.',
    imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=500&h=300&fit=crop',
    altText: 'Feature image',
    imagePosition: 'left',
    imageWidth: 50
  }
});