import React, { useState, useEffect, useRef } from 'react';
import { Play, Users, MessageCircle, Radio, Volume2 } from 'lucide-react';
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
    allowUserMessages = true,
    widthByDevice,
    muted = true,
    // CTA settings
    enableCTA = false,
    ctaDisplayTime = 60, // seconds
    ctaHeadline = '',
    ctaSubheadline = '',
    ctaButtonText = 'Click Here',
    ctaButtonUrl = '',
    ctaOpenNewTab = true,
    ctaButtonColor = '#3B82F6',
    ctaHeadlineColor = '#FFFFFF',
    ctaSubheadlineColor = '#E5E7EB',
  } = element.content as any;

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentViewerCount, setCurrentViewerCount] = useState(viewerCount);
  const [userMessage, setUserMessage] = useState('');
  const [isUnmuted, setIsUnmuted] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const videoTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

      // Initial delay then periodic messages - slower for realistic feel
      const interval1 = setTimeout(() => {
        addMessage();
        const interval2 = setInterval(() => {
          addMessage();
        }, 8000 + Math.random() * 12000); // 8-20 seconds apart for realistic live chat
        return () => clearInterval(interval2);
      }, 5000);

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

  // Track video time for CTA display
  useEffect(() => {
    if (isPlaying && enableCTA) {
      videoTimeIntervalRef.current = setInterval(() => {
        setVideoTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= ctaDisplayTime && !showCTA) {
            setShowCTA(true);
          }
          return newTime;
        });
      }, 1000);
      
      return () => {
        if (videoTimeIntervalRef.current) {
          clearInterval(videoTimeIntervalRef.current);
        }
      };
    }
  }, [isPlaying, enableCTA, ctaDisplayTime, showCTA]);

  // Note: Video starts with sound (mute=0) by default for proper audio playback

  // Handle sending user chat message
  const handleSendMessage = () => {
    if (userMessage.trim()) {
      const newMessage: ChatMessage = {
        id: `user-msg-${Date.now()}`,
        name: 'You',
        message: userMessage,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, newMessage]);
      setUserMessage('');
    }
  };

  // Build YouTube embed URL with all customization
  const buildEmbedUrl = (shouldMute: boolean = true) => {
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
    url.searchParams.set('mute', shouldMute ? '1' : '0'); // Start muted for autoplay
    url.searchParams.set('playsinline', '1');
    url.searchParams.set('disablekb', '1'); // Disable keyboard controls
    
    return url.toString();
  };

  // Handle unmute - reload iframe with unmuted URL
  const handleUnmute = () => {
    setIframeKey(prev => prev + 1);
    setIsUnmuted(true);
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
      {/* Video + Chat Container */}
      <div className={`flex gap-4 ${deviceType === 'mobile' ? 'flex-col' : 'flex-row'}`}>
        {/* Video Player */}
        <div 
          className={`relative bg-black ${deviceType === 'mobile' ? 'w-full' : 'flex-1'}`}
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
              key={iframeKey}
              ref={playerRef}
              src={buildEmbedUrl(!isUnmuted)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            
            {/* Blocking overlay to prevent all interactions - shown after unmuting for live-like feel */}
            {isUnmuted && (
              <div 
                className="absolute inset-0 z-10"
                onContextMenu={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => e.preventDefault()}
                onDoubleClick={(e) => e.preventDefault()}
                style={{ 
                  pointerEvents: 'auto',
                  touchAction: 'none',
                  cursor: 'default'
                }}
              />
            )}

            {/* Overlay to block right-click only when muted */}
            {!isUnmuted && (
              <div 
                className="absolute inset-0 pointer-events-none"
                onContextMenu={(e) => e.preventDefault()}
              />
            )}

            {/* Unmute Button */}
            {!isUnmuted && (
              <div className="absolute bottom-4 right-4 z-30">
                <button
                  onClick={handleUnmute}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg flex items-center gap-2 shadow-lg font-medium transition-all duration-200 hover:shadow-xl"
                  style={{
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <Volume2 className="h-5 w-5 animate-pulse" />
                  <span>Unmute Sound</span>
                </button>
              </div>
            )}
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
          <div className={`bg-gray-900 rounded-lg flex flex-col ${deviceType === 'mobile' ? 'w-full mt-4' : 'w-80 flex-shrink-0'}`} style={{ height: deviceType === 'mobile' ? '350px' : '500px' }}>
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2 text-white">
                <MessageCircle className="h-5 w-5" />
                <h4 className="font-semibold">Live Chat</h4>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ minHeight: 0, maxHeight: '100%' }}>
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`text-sm animate-in slide-in-from-top duration-300 ${
                  msg.name === 'You' ? 'text-green-400' : 'text-white'
                }`}>
                  <span className={`font-medium ${msg.name === 'You' ? 'text-green-300' : 'text-blue-400'}`}>
                    {msg.name}:
                  </span>
                  <span className="text-gray-300 ml-2">{msg.message}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            {allowUserMessages && (
              <div className="p-4 border-t border-gray-700 flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA Section */}
      {enableCTA && showCTA && ctaButtonUrl && (
        <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom duration-500">
          {ctaHeadline && (
            <h3 
              className="text-3xl font-bold mb-2"
              style={{ color: ctaHeadlineColor }}
            >
              {ctaHeadline}
            </h3>
          )}
          {ctaSubheadline && (
            <p 
              className="text-lg mb-4"
              style={{ color: ctaSubheadlineColor }}
            >
              {ctaSubheadline}
            </p>
          )}
          <a
            href={ctaButtonUrl}
            target={ctaOpenNewTab ? '_blank' : '_self'}
            rel={ctaOpenNewTab ? 'noopener noreferrer' : undefined}
            className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-transform hover:scale-105 shadow-lg"
            style={{ 
              backgroundColor: ctaButtonColor,
              color: '#FFFFFF'
            }}
          >
            {ctaButtonText}
          </a>
        </div>
      )}
    </div>
  );
};

