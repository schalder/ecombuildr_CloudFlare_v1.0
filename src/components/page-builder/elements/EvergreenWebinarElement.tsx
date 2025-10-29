import React, { useState, useEffect, useRef } from 'react';
import { Play, Users, MessageCircle, Radio, RadioIcon, Volume2, VolumeX } from 'lucide-react';
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
  "ধন্যবাদ, খুব কাজে লাগবে!",
  "এই ওয়েবিনারটার জন্য অনেকদিন ধরে অপেক্ষায় ছিলাম",
  "মাশাল্লাহ দারুণ বুঝিয়ে বলছেন",
  "আরো একটু ডিটেইলে বলবেন?",
  "আজকের দেখা সেরা সেশন এটা",
  "নোট নিচ্ছি",
  "গোল্ডেন ইনফরমেশন 🔥",
  "একদম প্র্যাকটিক্যাল কথা বলছেন",
  "এটা জানতাম না, অনেক কিছু শিখলাম",
  "সত্যি অসাধারণ লাগছে",
  "ঠিক এই জিনিসটাই দরকার ছিল",
  "এত সহজভাবে বুঝিয়ে দেওয়ার জন্য ধন্যবাদ",
  "আপনার উদাহরণগুলো খুব ক্লিয়ার",
  "ধীরে ধীরে বুঝতে পারছি",
  "আমি আগে ভুল করতাম, এখন বুঝতে পারছি",
  "ওয়াও, একদম মাইন্ড ব্লোয়িং",
  "এই টিপসটা সেভ করে রাখলাম",
  "ফাইনালি কেউ এত পরিষ্কারভাবে বুঝালো",
  "আপনার স্টেপগুলো খুব হেল্পফুল",
  "লিখে রাখলাম, পরে ফলো করবো",
  "স্যার, সত্যি আপনি অসাধারণ!",
  "প্র্যাকটিক্যাল গাইডলাইন দেয়ায় থ্যাঙ্কস",
  "আমি এটা সঙ্গে সঙ্গে ইমপ্লিমেন্ট করবো",
  "এমন সেশন বার বার দেখতে চাই",
  "আমি এখনো লাইভ আছি",
  "ওহহ এখন বুঝতে পারলাম!",
  "আপনাদের কাছ থেকে এটাই আশা করি",
  "এই জিনিসটা কেউ ফ্রি শেখায় না সাধারণত",
  "আরো টিপস দিলে ভালো লাগবে",
  "আলহামদুলিল্লাহ, আজ অনেক কিছু শিখলাম",
  "এই পার্টটা রিপিট করে বলবেন?",
  "সুপার এক্সপ্লেইনেশন",
  "বাহ, একদম রিয়েল লাইফ উদাহরণ",
  "লাস্ট পয়েন্টটা খুব ভালো লাগলো",
  "এই জিনিসটা আমি আমার ব্যবসায় লাগাবো",
  "মনে হচ্ছে আজকের দিনটা সফল",
  "আমার কনফিউশন এখন ক্লিয়ার",
  "আজকে যা শিখলাম, লাইফ চেঞ্জিং",
  "এটা তো একদম আমার সমস্যার সলিউশন",
  "আমি থাকছি শেষ পর্যন্ত",
  "অসাধারণ প্রেজেন্টেশন",
  "আপনার ভয়েস এবং টিচিং স্টাইল খুব ভালো লেগেছে",
  "একদম বুঝতে পারছি এখন",
  "আমি নোটস নিয়ে ফেলেছি",
  "এটা আগে জানলে অনেক লাভ হতো",
  "প্র্যাকটিক্যাল উদাহরণগুলো দারুণ",
  "এই গাইডলাইনটা আমার ব্যবসাকে এগিয়ে নেবে",
  "আগে কোথাও এত ক্লিয়ার পাইনি",
  "এখন থেকে নতুনভাবে কাজ করবো",
  "আজকের সেশন সত্যিই ভ্যালু-প্যাকড",
  "লাইভে এমন কোয়ালিটি পাওয়া ভাগ্যের ব্যাপার",
  "কনসেপ্টগুলো পরিষ্কার হয়ে গেল",
  "আমি আমার টিমকে এটা শেখাবো",
  "এই কৌশলটা একদম জিনিয়াস",
  "আপনি খুব সুন্দরভাবে ব্রেকডাউন করে বলছেন",
  "চমৎকার লেগেছে",
  "অনেক দিন পর এমন কিছু শিখলাম",
  "এই সিস্টেমটা ট্রাই করে দেখবো",
  "সবকিছু লিখে নিচ্ছি",
  "একদম ফ্রি মাস্টারক্লাস মনে হচ্ছে",
  "ভাই, স্যালুট আপনার নলেজকে",
  "এক কথায় অসাধারণ!",
  "এটা আগে কোন ট্রেনিং-এ পাইনি",
  "আমার চোখ খুলে গেল বলতে পারেন",
  "ইতিমধ্যে ফ্রেন্ডদের বলেছি এই সেশন দেখতে",
  "এই মেথডটা কাজে দেবে ইনশাআল্লাহ",
  "বিজনেস গ্রোথের জন্য পারফেক্ট",
  "আপনি একদম সহজ ভাষায় বোঝাচ্ছেন",
  "একদম রিয়েল লাইফ এক্সপেরিয়েন্স শেয়ার করছেন",
  "আমি স্ক্রিনশট নিয়ে রাখলাম",
  "এত ধৈর্য ধরে এভাবে শেখানোর জন্য ধন্যবাদ",
  "এই স্ট্রাটেজি যদি আগে জানতাম!",
  "নতুন আইডিয়া পেলাম",
  "নেক্সট স্লাইড প্লিজ",
  "মজা পাচ্ছি শিখতে শিখতে",
  "ভাই, আপনার ডেলিভারি স্টাইল চমৎকার",
  "এটা আমার ক্লায়েন্টদের কাজে লাগবে",
  "আপনার উদাহরণগুলো relatable.",
  "প্রথমবার বুঝলাম ব্যাপারটা আসলে কী",
  "আবার রিপ্লে দেখতে চাই",
  "আপনি কি এই প্রেজেন্টেশনের পিডিএফ দিবেন?",
  "খুব মনোযোগ দিয়ে শুনছি",
  "মাথায় ঢুকে যাচ্ছে একদম",
  "আমি আরও সেশন চাই আপনার থেকে",
  "এই স্লাইডটা অনেক ভালো",
  "প্লিজ একটু ধীরে বলবেন?",
  "ওকে, নোট করে রাখলাম",
  "আপনি কি রেকর্ডিং দিবেন?",
  "আমি এই টেকনিকটা আজই ফলো করবো",
  "আপনার ভাষা খুবই সহজ ও পরিষ্কার",
  "এই আইডিয়াটা আগে মাথায় আসেনি",
  "আমি বিস্মিত!",
  "নতুন দৃষ্টিভঙ্গি পেলাম",
  "গোপন রহস্য ফাঁস করে দিলেন আজ!",
  "আগে এত সুন্দর শেখাতে কেউ দেখিনি",
  "সব মিলিয়ে সেশনটা অসাধারণ",
  "এটা প্র্যাকটিস করলে রেজাল্ট নিশ্চিত",
  "আজকের সেশনে সময় দারুণ ইনভেস্ট হল",
  "আশা করি ভবিষ্যতে আরও সেশন করবেন",
  "আমি একদম একটুও বিরক্ত হইনি",
  "এটা সত্যি গেম চেঞ্জার!",
  "মনে হচ্ছে সঠিক জায়গায় ইনভেস্ট করেছি",
  "শেষ পর্যন্ত থাকবো, খুব ভালো লাগছে"
];

const fakeNames = [
  "রফিকুল ইসলাম", "সাবরিনা সুলতানা", "মাহমুদুল হাসান", "তানজিলা আক্তার", "ইমরান হোসেন",
  "মেহজাবিন রহমান", "জসিম উদ্দিন", "ফারহানা আক্তার", "সাদিকুর রহমান", "মাহমুদা খাতুন",
  "রিজওয়ান করিম", "শারমিন সুলতানা", "তানভীর আহমেদ", "মাহী আক্তার", "নাসিম উদ্দিন",
  "রুবাইয়া খান", "মোশাররফ হোসেন", "সুবর্ণা ইসলাম", "শফিকুল ইসলাম", "মিম আক্তার",
  "রাশেদুল ইসলাম", "সামিয়া হোসেন", "আরিফুল ইসলাম", "সাদিয়া সুলতানা", "রুবেল মিয়া",
  "ফারজানা ইয়াসমিন", "সৈকত আহমেদ", "নুসরাত জাহান", "মাসুম বিল্লাহ", "অর্পিতা সেন",
  "শাকিল আহমেদ", "মাহীর ইসলাম"
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
  const [isUnmuted, setIsUnmuted] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const unmuteAttempts = useRef(0);

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

  // Show unmute button when video starts playing
  useEffect(() => {
    if (showVideo && videoInfo && !isUnmuted) {
      // Show the unmute button after 1 second of video playing
      const timer = setTimeout(() => {
        setShowUnmuteButton(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showVideo, videoInfo, isUnmuted]);

  // Handle unmute button click
  const handleUnmute = () => {
    if (playerRef.current?.contentWindow) {
      // Try to unmute multiple times
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (playerRef.current?.contentWindow) {
            playerRef.current.contentWindow.postMessage(
              '{"event":"command","func":"unMute","args":""}',
              '*'
            );
          }
        }, i * 200); // Try every 200ms for 1 second
      }
      setIsUnmuted(true);
      setShowUnmuteButton(false);
    }
  };

  // Build YouTube embed URL with all customization
  const buildEmbedUrl = () => {
    if (!videoInfo || videoInfo.type !== 'youtube') return '';
    
    const url = new URL(`https://www.youtube.com/embed/${videoInfo.id}`);
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('controls', '0'); // No player controls
    url.searchParams.set('modestbranding', '1'); // Hide YouTube logo
    url.searchParams.set('rel', '0'); // Don't show related videos
    url.searchParams.set('showinfo', '0'); // Hide title/info
    url.searchParams.set('branding', '0'); // No branding
    url.searchParams.set('fs', '0'); // Disable fullscreen
    url.searchParams.set('iv_load_policy', '3'); // Hide annotations
    url.searchParams.set('loop', '1'); // Loop video
    url.searchParams.set('mute', '1'); // Start muted (will unmute via JS)
    url.searchParams.set('playsinline', '1');
    url.searchParams.set('disablekb', '1'); // Disable keyboard controls
    
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

  // Format countdown display based on seconds
  const formatCountdown = (seconds: number) => {
    if (seconds < 60) {
      return seconds.toString();
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                      <div className="text-9xl font-bold animate-pulse">{formatCountdown(countdown)}</div>
                      <div className="text-2xl mt-4">
                        {countdown > 60 ? 'শুরু হবে...' : 'Starting in...'}
                      </div>
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
              style={{ pointerEvents: 'none' }} // Disable all iframe interactions
            />
            
            {/* Invisible overlay to block ALL interactions with iframe */}
            <div 
              className="absolute inset-0 bg-transparent z-10 cursor-default"
              onContextMenu={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => e.preventDefault()}
              onDoubleClick={(e) => e.preventDefault()}
              style={{ 
                pointerEvents: 'auto',
                touchAction: 'none'
              }}
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

        {/* Unmute Button */}
        {showUnmuteButton && isPlaying && (
          <div className="absolute bottom-4 right-4 z-30">
            <button
              onClick={handleUnmute}
              onContextMenu={(e) => e.preventDefault()}
              className="bg-white text-black px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-lg font-medium"
              style={{ pointerEvents: 'auto' }}
            >
              <Volume2 className="h-5 w-5" />
              <span>Unmute Sound</span>
            </button>
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

