import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ArrowRight, Play, Star, Users, TrendingUp } from "lucide-react";
import { useMarketingContent } from "@/hooks/useMarketingContent";
import { parseVideoUrl, buildEmbedUrl } from "@/components/page-builder/utils/videoUtils";
import heroImage from "@/assets/hero-ecommerce.jpg";
export const Hero = () => {
  const {
    content: marketingContent
  } = useMarketingContent();

  // Determine what media to show
  const getHeroMedia = () => {
    if (marketingContent?.youtube_url) {
      const videoInfo = parseVideoUrl(marketingContent.youtube_url);
      if (videoInfo.type === 'youtube' && videoInfo.id) {
        const embedUrl = `https://www.youtube-nocookie.com/embed/${videoInfo.id}?rel=0`;
        return {
          type: 'video',
          url: embedUrl
        };
      }
    }
    const imageUrl = marketingContent?.hero_image_url || heroImage;
    return {
      type: 'image',
      url: imageUrl
    };
  };
  const heroMedia = getHeroMedia();
  return <div className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,219,226,0.1)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(251,146,60,0.1)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-2 backdrop-blur-sm border border-success/20 rounded-full px-4 py-2 text-sm font-medium text-success bg-cyan-700">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-slate-50">দ্রুত সেল শুরু করতে না পেরে কাস্টমার হারাচ্ছেন?</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                <span className="block">Build Your</span>
                <span className="block bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
                  E-commerce Empire
                </span>
                <span className="block">In Minutes, Not Months</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-primary-light/90 max-w-xl mx-auto lg:mx-0">
                Create conversion-driven online stores without coding. 
                From landing pages to full e-commerce - everything you need to turn traffic into sales.
              </p>
            </div>

            {/* Mobile Media - Show below headline on mobile only */}
            <div className="lg:hidden">
              <div className="relative rounded-2xl overflow-hidden shadow-glow">
                {heroMedia.type === 'video' ? <AspectRatio ratio={16 / 9} className="rounded-2xl overflow-hidden">
                    <iframe src={heroMedia.url} title="Hero Video" className="w-full h-full rounded-2xl" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </AspectRatio> : <img src={heroMedia.url} alt="F-Commerce Platform Dashboard" className="w-full h-auto rounded-2xl" />}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-white/80">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                <span className="font-semibold">250+ Entrepreneurs</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span className="font-semibold">500% ROI Increase</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-accent fill-current" />
                <span className="font-semibold">98% Success Rate</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="accent" size="lg" className="group" onClick={() => {
              window.location.href = '/#pricing';
            }}>
                Start Building Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <a href="https://shop.powerkits.net/" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white hover:text-primary">
                  <Play className="h-5 w-5" />
                  View Live Demo
                </Button>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-white/70">
              <span>✓ 7-Day Free Trial</span>
              <span>✓ No Credit Card Required</span>
              <span>✓ 24/7 Expert Support</span>
            </div>
          </div>

          {/* Right Content - Hero Media - Hidden on mobile */}
          <div className="relative hidden lg:block">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-glow">
              {heroMedia.type === 'video' ? <AspectRatio ratio={16 / 9} className="rounded-2xl overflow-hidden">
                  <iframe src={heroMedia.url} title="Hero Video" className="w-full h-full rounded-2xl" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </AspectRatio> : <img src={heroMedia.url} alt="F-Commerce Platform Dashboard" className="w-full h-auto rounded-2xl" />}
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-gradient-card rounded-lg p-4 shadow-large backdrop-blur-sm border border-white/20 animate-pulse">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <TrendingUp className="h-4 w-4 text-success" />
                <span>500% ROI Increase</span>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -left-6 bg-gradient-card rounded-lg p-4 shadow-large backdrop-blur-sm border border-white/20 animate-pulse">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Users className="h-4 w-4 text-accent" />
                <span>30+ New Orders Daily</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>;
};