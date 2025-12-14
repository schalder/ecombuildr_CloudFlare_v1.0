import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Palette, 
  Zap, 
  Image as ImageIcon, 
  Sparkles,
  Play,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AddonApp {
  id: string;
  title: string;
  description: string;
  features: string[];
  icon: typeof Palette;
  color: string;
  bgColor: string;
  image: string; // Placeholder for app image
  videoUrl: string;
}

const addonApps: AddonApp[] = [
  {
    id: "design-studio",
    title: "Design Studio",
    description: "Create stunning images for products, social media posts, ads, and more. Included 5000+ design assets in the library.",
    features: [
      "5000+ Design Assets",
      "Product Image Creation",
      "Social Media Templates",
      "Ad Design Tools"
    ],
    icon: Palette,
    color: "text-primary",
    bgColor: "bg-primary-light",
    image: "/placeholder-design-studio.jpg",
    videoUrl: "https://www.youtube.com/watch?v=Nl6_li1IGSk"
  },
  {
    id: "ads-funnel-ai",
    title: "Ads Funnel AI",
    description: "Write Facebook ads copy in 30 seconds or less. Swipe winning ad content from Facebook ads library. Generate organic posts for your Facebook page.",
    features: [
      "30-Second Ad Copy Generation",
      "Swipe Winning Ads Library",
      "Organic Post Generator",
      "Facebook Ads Optimization"
    ],
    icon: Zap,
    color: "text-accent",
    bgColor: "bg-accent-light",
    image: "/placeholder-ads-funnel.jpg",
    videoUrl: "https://www.youtube.com/watch?v=Nl6_li1IGSk"
  },
  {
    id: "layerblend",
    title: "LayerBlend",
    description: "Image background removal app and add text behind image. Professional image editing made simple.",
    features: [
      "Background Removal",
      "Text Behind Image",
      "Professional Editing",
      "Quick Export"
    ],
    icon: ImageIcon,
    color: "text-success",
    bgColor: "bg-success-light",
    image: "/placeholder-layerblend.jpg",
    videoUrl: "https://www.youtube.com/watch?v=Nl6_li1IGSk"
  },
  {
    id: "ai-magic-prompt",
    title: "AI Magic Prompt",
    description: "AI prompt library with 100s of ready-to-use prompts to create stunning product photos, Facebook posts, viral images, video thumbnails, generate videos, ads content, landing page content, and more.",
    features: [
      "100+ Ready-to-Use Prompts",
      "Product Photo Generation",
      "Viral Image Creation",
      "Video & Content Generation"
    ],
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary-light",
    image: "/placeholder-ai-magic.jpg",
    videoUrl: "https://www.youtube.com/watch?v=Nl6_li1IGSk"
  }
];

const convertYouTubeUrl = (url: string): string => {
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes('youtube.com/embed/')) {
    return url;
  }
  return url;
};

export const AddonAppsShowcase = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);

  // Auto-scroll functionality
  useEffect(() => {
    if (!autoScrollEnabled || expandedCard || isScrollingRef.current) {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const scroll = () => {
      const container = scrollContainer;
      const scrollAmount = container.clientWidth;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const currentScroll = container.scrollLeft;

      if (currentScroll >= maxScroll - 10) {
        // Reached the end, scroll back to start
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Scroll forward
        container.scrollTo({ 
          left: currentScroll + scrollAmount, 
          behavior: 'smooth' 
        });
      }
    };

    autoScrollIntervalRef.current = setInterval(scroll, 5000); // Scroll every 5 seconds

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [autoScrollEnabled, expandedCard]);

  // Pause auto-scroll when card is expanded
  useEffect(() => {
    if (expandedCard) {
      setAutoScrollEnabled(false);
    } else {
      // Resume auto-scroll after a delay when collapsed
      const timer = setTimeout(() => {
        setAutoScrollEnabled(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [expandedCard]);

  const handleWatchDemo = (appId: string) => {
    setExpandedCard(expandedCard === appId ? null : appId);
  };

  const handleManualScroll = () => {
    isScrollingRef.current = true;
    setAutoScrollEnabled(false);
    
    // Resume auto-scroll after user stops scrolling
    clearTimeout(autoScrollIntervalRef.current as any);
    setTimeout(() => {
      isScrollingRef.current = false;
      if (!expandedCard) {
        setAutoScrollEnabled(true);
      }
    }, 3000);
  };

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth;
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      handleManualScroll();
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      handleManualScroll();
    }
  };

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful Addon Apps <span className="text-accent">Included with Every Plan</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Boost your productivity with these powerful tools included in all our pricing plans
          </p>
        </div>

        {/* Cards Container */}
        <div className="relative">
          {/* Navigation Buttons - Desktop Only */}
          <div className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
              onClick={scrollRight}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Scrollable Cards */}
          <div
            ref={scrollContainerRef}
            onScroll={handleManualScroll}
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {addonApps.map((app) => {
              const IconComponent = app.icon;
              const isExpanded = expandedCard === app.id;
              const videoEmbedUrl = convertYouTubeUrl(app.videoUrl);

              return (
                <Card
                  key={app.id}
                  className={cn(
                    "flex-shrink-0 w-full md:w-[500px] lg:w-[600px] transition-all duration-300 border-border/50 hover:border-accent/30 bg-gradient-card",
                    isExpanded && "md:w-[800px] lg:w-[900px]"
                  )}
                >
                  <div className="p-6 md:p-8">
                    {/* App Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-lg ${app.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`h-8 w-8 ${app.color}`} />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold text-foreground mb-2">
                          {app.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {app.description}
                        </p>
                      </div>
                    </div>

                    {/* Features List - Only show when not expanded */}
                    {!isExpanded && (
                      <ul className="space-y-2 mb-6">
                        {app.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-3 text-foreground">
                            <Zap className="h-4 w-4 text-accent flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Image/Video Section */}
                    <div className="relative mb-6 rounded-lg overflow-hidden bg-muted">
                      {isExpanded ? (
                        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                          <iframe
                            src={videoEmbedUrl}
                            className="w-full h-full"
                            allowFullScreen
                            title={`${app.title} Demo`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                            onClick={() => handleWatchDemo(app.id)}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                          {/* Placeholder image - you can replace with actual images */}
                          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                            <div className="text-center p-8">
                              <IconComponent className={`h-16 w-16 ${app.color} mx-auto mb-4 opacity-50`} />
                              <p className="text-muted-foreground text-sm">App Preview Image</p>
                            </div>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors">
                            <Button
                              variant="accent"
                              size="lg"
                              className="group"
                              onClick={() => handleWatchDemo(app.id)}
                            >
                              <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                              Watch Demo
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Watch Demo Button - Only show when not expanded */}
                    {!isExpanded && (
                      <Button
                        variant="accent"
                        className="w-full"
                        onClick={() => handleWatchDemo(app.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Watch Demo
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            All addon apps are included with every pricing plan at no extra cost
          </p>
        </div>

      </div>
    </section>
  );
};

