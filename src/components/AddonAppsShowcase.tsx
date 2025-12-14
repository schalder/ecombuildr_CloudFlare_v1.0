import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Palette, 
  Zap, 
  Image as ImageIcon, 
  Sparkles,
  Play,
  X
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
  const [selectedVideo, setSelectedVideo] = useState<{ appId: string; url: string; title: string } | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);

  // Auto-scroll functionality for mobile only
  useEffect(() => {
    // Only enable auto-scroll on mobile
    const isMobile = window.innerWidth < 768;
    if (!isMobile || !autoScrollEnabled || selectedVideo || isScrollingRef.current) {
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
  }, [autoScrollEnabled, selectedVideo]);

  // Pause auto-scroll when video dialog is open
  useEffect(() => {
    if (selectedVideo) {
      setAutoScrollEnabled(false);
    } else {
      // Resume auto-scroll after a delay when closed
      const timer = setTimeout(() => {
        setAutoScrollEnabled(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedVideo]);

  const handleWatchDemo = (app: AddonApp) => {
    setSelectedVideo({
      appId: app.id,
      url: convertYouTubeUrl(app.videoUrl),
      title: app.title
    });
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  const handleManualScroll = () => {
    isScrollingRef.current = true;
    setAutoScrollEnabled(false);
    
    // Resume auto-scroll after user stops scrolling
    clearTimeout(autoScrollIntervalRef.current as any);
    setTimeout(() => {
      isScrollingRef.current = false;
      if (!selectedVideo) {
        setAutoScrollEnabled(true);
      }
    }, 3000);
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

        {/* Desktop Grid Layout - 4 columns */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-8 mb-12">
          {addonApps.map((app) => {
            const IconComponent = app.icon;

            return (
              <Card 
                key={app.id}
                className="p-6 hover:shadow-medium transition-all duration-300 border-border/50 hover:border-accent/30 bg-gradient-card"
              >
                {/* App Icon */}
                <div className={`w-16 h-16 rounded-lg ${app.bgColor} flex items-center justify-center mb-4`}>
                  <IconComponent className={`h-8 w-8 ${app.color}`} />
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {app.title}
                </h3>
                
                {/* Description */}
                <p className="text-muted-foreground leading-relaxed mb-4 text-sm">
                  {app.description}
                </p>
                
                {/* Features List */}
                <ul className="space-y-2 mb-6">
                  {app.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-foreground">
                      <Zap className="h-3 w-3 text-accent flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Image Preview */}
                <div className="relative mb-4 rounded-lg overflow-hidden bg-muted" style={{ aspectRatio: '16/9' }}>
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <div className="text-center p-4">
                      <IconComponent className={`h-12 w-12 ${app.color} mx-auto mb-2 opacity-50`} />
                      <p className="text-muted-foreground text-xs">App Preview</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <Play className="h-6 w-6 text-foreground" />
                    </div>
                  </div>
                </div>

                {/* Watch Demo Button */}
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={() => handleWatchDemo(app)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Watch Demo
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Mobile/Tablet Horizontal Scroll Layout */}
        <div className="lg:hidden relative">
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

              return (
                <Card
                  key={app.id}
                  className="flex-shrink-0 w-[85vw] sm:w-[400px] p-6 hover:shadow-medium transition-all duration-300 border-border/50 hover:border-accent/30 bg-gradient-card"
                >
                  {/* App Icon */}
                  <div className={`w-16 h-16 rounded-lg ${app.bgColor} flex items-center justify-center mb-4`}>
                    <IconComponent className={`h-8 w-8 ${app.color}`} />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {app.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {app.description}
                  </p>
                  
                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    {app.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-foreground">
                        <Zap className="h-4 w-4 text-accent flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Image Preview */}
                  <div className="relative mb-4 rounded-lg overflow-hidden bg-muted" style={{ aspectRatio: '16/9' }}>
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <div className="text-center p-8">
                        <IconComponent className={`h-16 w-16 ${app.color} mx-auto mb-4 opacity-50`} />
                        <p className="text-muted-foreground text-sm">App Preview Image</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors">
                      <div className="w-16 h-16 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                        <Play className="h-8 w-8 text-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Watch Demo Button */}
                  <Button
                    variant="accent"
                    className="w-full"
                    onClick={() => handleWatchDemo(app)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch Demo
                  </Button>
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

      {/* Video Dialog - Centered Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={handleCloseVideo}>
        <DialogContent 
          className="max-w-4xl w-full p-0 gap-0"
          hideClose={false}
        >
          {selectedVideo && (
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              <iframe
                src={selectedVideo.url}
                className="w-full h-full rounded-t-lg"
                allowFullScreen
                title={`${selectedVideo.title} Demo`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
