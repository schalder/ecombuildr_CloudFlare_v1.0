import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star, Users, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-ecommerce.jpg";
export const Hero = () => {
  return <div className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,219,226,0.1)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(251,146,60,0.1)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-2 bg-success-light/50 backdrop-blur-sm border border-success/20 rounded-full px-4 py-2 text-sm font-medium text-success">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-slate-50">১০,০০০+ ব্যবসায়ী ব্যবহার করছেন</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                <span className="block">Facebook থেকে</span>
                <span className="block bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
                  Professional Store
                </span>
                <span className="block">৫ মিনিটেই তৈরি করুন</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-primary-light/90 max-w-xl mx-auto lg:mx-0">
                কোডিং ছাড়াই তৈরি করুন আপনার ই-কমার্স স্টোর। 
                Cash on Delivery, Product Library এবং Landing Page Builder - সব এক জায়গায়।
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-white/80">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                <span className="font-semibold">১০,০০০+ ব্যবসায়ী</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span className="font-semibold">৩০০% বেশি সেল</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-accent fill-current" />
                <span className="font-semibold">৯৮% সন্তুষ্ট গ্রাহক</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="/auth">
                <Button variant="accent" size="lg" className="group">
                  ফ্রি শুরু করুন
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              
              <a href="/store/communityhq" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white hover:text-primary">
                  <Play className="h-5 w-5" />
                  লাইভ স্টোর দেখুন
                </Button>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-white/70">
              <span>✓ ৭ দিন ফ্রি ট্রায়াল</span>
              <span>✓ ক্রেডিট কার্ড লাগবে না</span>
              <span>✓ ২৪/৭ সাপোর্ট</span>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-glow">
              <img src={heroImage} alt="F-Commerce Platform Dashboard" className="w-full h-auto rounded-2xl" />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-gradient-card rounded-lg p-4 shadow-large backdrop-blur-sm border border-white/20 animate-pulse">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <TrendingUp className="h-4 w-4 text-success" />
                <span>৫০০% ROI বৃদ্ধি</span>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -left-6 bg-gradient-card rounded-lg p-4 shadow-large backdrop-blur-sm border border-white/20 animate-pulse">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Users className="h-4 w-4 text-accent" />
                <span>৩০+ নতুন অর্ডার</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>;
};