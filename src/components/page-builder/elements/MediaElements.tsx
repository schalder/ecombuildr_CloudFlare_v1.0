import React, { useState, useEffect } from 'react';
import { Image, Video, ChevronLeft, ChevronRight, Play, Radio, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';
import { InlineEditor } from '../components/InlineEditor';
import { renderElementStyles } from '../utils/styleRenderer';
import { getEffectiveResponsiveValue } from '../utils/responsiveHelpers';
import { parseVideoUrl, buildEmbedUrl } from '../utils/videoUtils';
import { EvergreenWebinarElement } from './EvergreenWebinarElement';

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

  // Create overlapping slides for one-by-one scrolling
  const slides = [];
  for (let i = 0; i <= images.length - visibleImages; i++) {
    slides.push(images.slice(i, i + visibleImages));
  }

  // Get grid class based on visibleImages
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
        <Carousel className="w-full" setApi={setApi} opts={{ loop: true, slidesToScroll: 1 }}>
          <CarouselContent>
            {slides.map((slideImages: string[], slideIndex: number) => (
              <CarouselItem key={slideIndex}>
                <div className={`grid gap-1 ${getGridClass(visibleImages)}`}>
                  {slideImages.map((image: string, imageIndex: number) => {
                    if (!image) return null;
                    return (
                      <div key={imageIndex} className="p-1">
                        <img
                          src={image}
                          alt={`Carousel image ${slideIndex * visibleImages + imageIndex + 1}`}
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
            ))}
          </CarouselContent>
          {showArrows && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}
        </Carousel>
        
        {showDots && slides.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {slides.map((_, slideIndex) => (
              <button
                key={slideIndex}
                className={`w-2 h-2 rounded-full transition-colors ${
                  slideIndex === currentIndex ? 'bg-primary' : 'bg-primary/30'
                }`}
                onClick={() => api?.scrollTo(slideIndex)}
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
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  // Parse video URL to determine type and get embed URL
  const getVideoInfo = (video: any) => {
    if (!video.url) return null;
    return parseVideoUrl(video.url);
  };

  const renderVideoPlayer = (video: any) => {
    const videoInfo = getVideoInfo(video);
    if (!videoInfo) return null;

    const embedUrl = buildEmbedUrl(videoInfo.embedUrl || video.url, videoInfo.type, {
      autoplay: autoPlay,
      controls: showControls,
      muted: muted
    });

    // Use thumbnail from video info if available, otherwise use provided thumbnail
    const thumbnailUrl = videoInfo.thumbnailUrl || video.thumbnail;
    const isPlaying = playingVideo === video.url;

    if (videoInfo.type === 'hosted') {
      // Direct video file - use HTML5 video element
      return (
        <video
          key={video.url}
          controls={showControls}
          autoPlay={autoPlay}
          muted={muted}
          className="w-full h-full"
          poster={thumbnailUrl}
        >
          <source src={video.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      // YouTube, Vimeo, Wistia - show thumbnail preview or iframe
      if (isPlaying) {
        // Show iframe when playing
        return (
          <iframe
            key={video.url}
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        );
      } else {
        // Show thumbnail preview when not playing
        return (
          <div 
            className="w-full h-full relative cursor-pointer group"
            onClick={() => setPlayingVideo(video.url)}
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <Play className="h-16 w-16 text-white opacity-80" />
              </div>
            )}
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200">
              <div className="bg-white bg-opacity-90 rounded-full p-4 group-hover:bg-opacity-100 transition-all duration-200">
                <Play className="h-8 w-8 text-black ml-1" />
              </div>
            </div>
            
            {/* Video title overlay */}
            {video.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <h3 className="text-white text-lg font-semibold">{video.title}</h3>
              </div>
            )}
          </div>
        );
      }
    }
  };

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
            {renderVideoPlayer(currentVideo)}
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
                onClick={() => {
                  setCurrentVideo(video);
                  setPlayingVideo(null); // Reset playing state when switching videos
                }}
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

// Audio Player Element
const AudioPlayerElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, deviceType = 'desktop' }) => {
  const audioUrl = element.content.audioUrl || '';
  const autoplay = element.content.autoplay || false;
  const loop = element.content.loop || false;
  const showVolume = element.content.showVolume !== false; // Default to true

  // Get custom colors from styles
  const playerBackgroundColor = element.styles?.playerBackgroundColor || '';
  const buttonColor = element.styles?.buttonColor || '';
  const progressBarColor = element.styles?.progressBarColor || '';

  // Build custom CSS for audio player
  const audioPlayerStyles: React.CSSProperties = {
    ...renderElementStyles(element, deviceType),
  };

  // Generate CSS for custom colors
  const customCSS = `
    .audio-player-${element.id} {
      ${playerBackgroundColor ? `background-color: ${playerBackgroundColor} !important;` : ''}
      ${playerBackgroundColor ? `border-radius: 8px;` : ''}
      ${playerBackgroundColor ? `padding: 12px;` : ''}
    }
    .audio-player-${element.id} audio {
      width: 100%;
    }
    .audio-player-${element.id} audio::-webkit-media-controls-panel {
      ${playerBackgroundColor ? `background-color: ${playerBackgroundColor} !important;` : ''}
    }
    .audio-player-${element.id} audio::-webkit-media-controls-play-button,
    .audio-player-${element.id} audio::-webkit-media-controls-pause-button,
    .audio-player-${element.id} audio::-webkit-media-controls-mute-button,
    .audio-player-${element.id} audio::-webkit-media-controls-volume-slider {
      ${buttonColor ? `background-color: ${buttonColor} !important;` : ''}
    }
    .audio-player-${element.id} audio::-webkit-media-controls-current-time-display,
    .audio-player-${element.id} audio::-webkit-media-controls-time-remaining-display {
      ${buttonColor ? `color: ${buttonColor} !important;` : ''}
    }
    .audio-player-${element.id} audio::-webkit-media-controls-timeline {
      ${progressBarColor ? `background-color: ${progressBarColor} !important;` : ''}
    }
    .audio-player-${element.id} audio::-webkit-media-controls-volume-slider-container {
      ${!showVolume ? `display: none !important;` : ''}
    }
  `;

  if (isEditing && !audioUrl) {
    return (
      <div className="max-w-2xl mx-auto" style={audioPlayerStyles}>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Add an audio file in the properties panel</p>
        </div>
      </div>
    );
  }

  if (!audioUrl) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customCSS }} />
      <div className="max-w-2xl mx-auto" style={audioPlayerStyles}>
        <div className={`audio-player-${element.id}`}>
          <audio
            controls
            controlsList="nodownload"
            autoPlay={autoplay}
            loop={loop}
            preload="metadata"
            style={{
              width: '100%',
            }}
          >
            <source src={audioUrl} type="audio/mpeg" />
            <source src={audioUrl} type="audio/wav" />
            <source src={audioUrl} type="audio/ogg" />
            Your browser does not support the audio element.
          </audio>
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

  elementRegistry.register({
    id: 'evergreen-webinar',
    name: 'Evergreen Webinar',
    category: 'media',
    icon: Radio,
    component: EvergreenWebinarElement,
    defaultContent: {
      videoUrl: '',
      thumbnail: '',
      enableCountdown: true,
      countdownSeconds: 10,
      enableChat: true,
      viewerCount: 237,
      showChatMessages: true,
      allowUserMessages: true,
      showLiveBadge: true,
      liveBadgePosition: 'top-right',
      liveBadgeStyle: 'pulse-text',
      muted: true,
      // CTA settings
      enableCTA: false,
      ctaDisplayTime: 60,
      ctaHeadline: '',
      ctaSubheadline: '',
      ctaButtonText: 'Click Here',
      ctaButtonSubtext: '',
      ctaButtonUrl: '',
      ctaOpenNewTab: true,
      ctaButtonColor: '#3B82F6',
      ctaHeadlineColor: '#FFFFFF',
      ctaSubheadlineColor: '#E5E7EB',
      ctaBackgroundColor: 'transparent',
      // Scheduled Messages settings
      enableScheduledMessages: false,
      scheduledMessageGroups: [],
      // Redirect settings
      enableRedirect: false,
      redirectTime: 600, // 10 minutes default (in seconds)
      redirectUrl: '',
      redirectOpenNewTab: false,
      widthByDevice: {
        desktop: 'full',
        tablet: 'full',
        mobile: 'full'
      }
    },
    description: 'Live-like webinar experience with countdown, chat, and live indicators'
  });

  elementRegistry.register({
    id: 'audio-player',
    name: 'Audio Player',
    category: 'media',
    icon: Music,
    component: AudioPlayerElement,
    defaultContent: {
      audioUrl: '',
      autoplay: false,
      loop: false,
      showVolume: true
    },
    description: 'MP3 audio player'
  });
};