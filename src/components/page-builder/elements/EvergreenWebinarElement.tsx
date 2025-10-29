import React, { useState, useEffect, useRef } from 'react';
import { Play, Users, MessageCircle, Radio, RadioIcon } from 'lucide-react';
import { PageBuilderElement } from '../types';
import { renderElementStyles } from '../utils/styleRenderer';
import { parseVideoUrl } from '../utils/videoUtils';

interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: number;
}

const chatMessagePool = [
  "This is so helpful, thank you!",
  "I've been waiting for this webinar",
  "Great explanation",
  "Can you explain more about this?",
  "Best webinar I've attended today",
  "Thanks for the tips",
  "Very clear presentation",
  "I'm taking notes",
  "This is gold!",
  "Great insights",
  "Exactly what I needed",
  "Amazing information",
  "So informative",
  "Really appreciate this",
  "This is exactly the solution I was looking for",
  "Thanks for sharing your knowledge",
  "Great job explaining this",
  "I'm learning so much",
  "This webinar is incredible",
  "Can't wait to implement this",
];

const fakeNames = [
  "John S.", "Sarah M.", "Mike T.", "Emily R.", "David L.", "Jessica K.",
  "James W.", "Lisa P.", "Robert B.", "Amanda H.", "Michael C.", "Jennifer A.",
  "William N.", "Elizabeth F.", "Christopher D.", "Michelle G.", "Daniel J.",
  "Ashley O.", "Matthew R.", "Nicole Q.", "Andrew L.", "Stephanie M.",
  "Joshua K.", "Rebecca T.", "Ryan B.", "Amanda V.", "Kevin S.", "Melissa P.",
  "Brandon W.", "Rachel G.", "Justin H.", "Samantha D.",
];

export const EvergreenWebinarElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, deviceType = 'desktop' }) => {
  const {
    videoUrl = '',
    thumbnail = '',
    enableCountdown = false,
    countdownSeconds = 5,
    enableChat = true,
    viewerCount = 237,
    showChatMessages = true,
    showLiveBadge = true,
    liveBadgePosition = 'top-right',
    liveBadgeStyle = 'pulse-text',
    widthByDevice,
    muted = true,
  } = element.content as any;

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentViewerCount, setCurrentViewerCount] = useState(viewerCount);
  const playerRef = useRef<HTMLIFrameElement>(null);

  // Parse video URL
  const videoInfo = videoUrl ? parseVideoUrl(videoUrl) : null;
  const thumbnailUrl = thumbnail || (videoInfo?.thumbnailUrl || 'https://via.placeholder.com/1280x720?text=Webinar+Starting+Soon');

  // Start countdown when component mounts
  useEffect(() => {
    if (enableCountdown && !isPlaying) {
      setCountdown(countdownSeconds);
    } else if (!enableCountdown && !isPlaying) {
      // If no countdown, just show the video after a brief moment
      setTimeout(() => {
        setShowVideo(true);
        setIsPlaying(true);
      }, 500);
    }
  }, []);

  // Countdown logic
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setTimeout(() => {
        setShowVideo(true);
        setIsPlaying(true);
        setCountdown(null);
      }, 1000);
    }
  }, [countdown]);

  // Initialize chat messages
  useEffect(() => {
    if (enableChat && isPlaying && showChatMessages) {
      // Add initial messages
      const initialMessages: ChatMessage[] = [];
      for (let i = 0; i < 3; i++) {
        initialMessages.push({
          id: `msg-${Date.now()}-${i}`,
          name: fakeNames[Math.floor(Math.random() * fakeNames.length)],
          message: chatMessagePool[Math.floor(Math.random() * chatMessagePool.length)],
          timestamp: Date.now() - (3 - i) * 3000,
        });
      }
      setChatMessages(initialMessages);

      // Add new messages periodically
      const addMessage = () => {
        setChatMessages((prev) => {
          const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            name: fakeNames[Math.floor(Math.random() * fakeNames.length)],
            message: chatMessagePool[Math.floor(Math.random() * chatMessagePool.length)],
            timestamp: Date.now(),
          };
          // Keep only last 15 messages
          return [...prev.slice(-14), newMessage];
        });
      };

      // Initial delay then periodic messages
      const interval1 = setTimeout(() => {
        addMessage();
        const interval2 = setInterval(() => {
          addMessage();
        }, 3000 + Math.random() * 7000); // 3-10 seconds apart
        return () => clearInterval(interval2);
      }, 2000);

      return () => {
        clearTimeout(interval1);
      };
    }
  }, [enableChat, isPlaying, showChatMessages]);

  // Simulate viewer count changes
  useEffect(() => {
    if (enableChat && isPlaying) {
      const interval = setInterval(() => {
        setCurrentViewerCount((prev) => prev + Math.floor(Math.random() * 3) - 1);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [enableChat, isPlaying]);

  // Build YouTube embed URL with all customization
  const buildEmbedUrl = () => {
    if (!videoInfo || videoInfo.type !== 'youtube') return '';
    
    const url = new URL(`https://www.youtube.com/embed/${videoInfo.id}`);
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('controls', '0');
    url.searchParams.set('modestbranding', '1');
    url.searchParams.set('rel', '0');
    url.searchParams.set('showinfo', '0');
    url.searchParams.set('branding', '0');
    url.searchParams.set('fs', '0'); // Disable fullscreen
    url.searchParams.set('iv_load_policy', '3'); // Hide annotations
    url.searchParams.set('loop', '1'); // Loop video
    url.searchParams.set('mute', muted ? '1' : '0');
    url.searchParams.set('playsinline', '1');
    
    return url.toString();
  };

  const containerStyles = renderElementStyles(element, deviceType);
  const { width: _, maxWidth: __, minWidth: ___, ...cleanContainerStyles } = containerStyles;

  const normalizedWidthByDevice = {
    desktop: widthByDevice?.desktop || 'full',
    tablet: widthByDevice?.tablet || 'full',
    mobile: widthByDevice?.mobile || 'full',
  };

  const getEffectiveWidth = () => {
    switch (deviceType) {
      case 'mobile':
        return normalizedWidthByDevice.mobile;
      case 'tablet':
        return normalizedWidthByDevice.tablet;
      default:
        return normalizedWidthByDevice.desktop;
    }
  };

  const effectiveWidth = getEffectiveWidth();

  const widthClasses = {
    full: 'w-full',
    'three-quarters': 'w-[75%] mx-auto',
    half: 'w-1/2 mx-auto',
  };

  const getLiveBadgeStyles = () => {
    const baseStyles = 'absolute z-20';
    
    const positionStyles = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
    };

    return `${baseStyles} ${positionStyles[liveBadgePosition as keyof typeof positionStyles]}`;
  };

  return (
    <div style={cleanContainerStyles} className={`${widthClasses[effectiveWidth as keyof typeof widthClasses] || 'w-full'}`}>
      <div 
        className="relative w-full bg-black"
        style={{ aspectRatio: '16/9' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Live Badge */}
        {showLiveBadge && isPlaying && (
          <div className={getLiveBadgeStyles()}>
            {liveBadgeStyle === 'pulse-text' && (
              <div className="bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                <Radio className="h-4 w-4 fill-current" />
                <span className="font-bold">LIVE</span>
              </div>
            )}
            {liveBadgeStyle === 'red-dot' && (
              <div className="bg-red-600 rounded-full p-2 animate-pulse">
                <div className="w-3 h-3 bg-red-400 rounded-full" />
              </div>
            )}
            {liveBadgeStyle === 'pulse-bg' && (
              <div className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold relative overflow-hidden animate-pulse">
                <span className="relative z-10">LIVE</span>
                <div className="absolute inset-0 bg-red-700 animate-ping" />
              </div>
            )}
          </div>
        )}

        {/* Before video starts - Thumbnail */}
        {!showVideo && (
          <div className="relative w-full h-full">
            <img 
              src={thumbnailUrl} 
              alt="Webinar" 
              className="w-full h-full object-cover"
            />
            
            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center">
                  {countdown > 0 ? (
                    <div className="text-white">
                      <div className="text-9xl font-bold animate-pulse">{countdown}</div>
                      <div className="text-2xl mt-4">Starting in...</div>
                    </div>
                  ) : (
                    <div className="text-white text-6xl font-bold animate-pulse">LIVE!</div>
                  )}
                </div>
              </div>
            )}

            {/* Play button overlay if no countdown */}
            {countdown === null && !showVideo && !enableCountdown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white bg-opacity-90 rounded-full p-6">
                  <Play className="h-16 w-16 text-black ml-2" fill="currentColor" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Video Player */}
        {showVideo && videoInfo && (
          <>
            <iframe
              ref={playerRef}
              src={buildEmbedUrl()}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ pointerEvents: isPlaying ? 'auto' : 'none' }}
            />
            
            {/* Overlay to prevent interactions */}
            <div 
              className="absolute inset-0 pointer-events-none"
              onContextMenu={(e) => e.preventDefault()}
              style={{ pointerEvents: 'none' }}
            />
          </>
        )}

        {/* Viewer Count */}
        {enableChat && isPlaying && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg flex items-center gap-2 z-20">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">{currentViewerCount} watching</span>
          </div>
        )}
      </div>

      {/* Live Chat Panel */}
      {enableChat && showChatMessages && isPlaying && (
        <div className="mt-4 bg-gray-900 rounded-lg p-4" style={{ maxHeight: '300px' }}>
          <div className="flex items-center gap-2 mb-3 text-white">
            <MessageCircle className="h-5 w-5" />
            <h4 className="font-semibold">Live Chat</h4>
          </div>
          <div className="overflow-y-auto space-y-2" style={{ maxHeight: '250px' }}>
            {chatMessages.map((msg) => (
              <div key={msg.id} className="text-sm text-white animate-in slide-in-from-top duration-300">
                <span className="font-medium text-blue-400">{msg.name}</span>
                <span className="text-gray-300 ml-2">{msg.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

