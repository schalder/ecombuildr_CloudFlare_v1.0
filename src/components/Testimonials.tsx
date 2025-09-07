import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "মনির আহমেদ",
    business: "ফ্যাশন বুটিক শপ",
    revenue: "৫০,০০০ টাকা+ মাসিক",
    content: "আমার ছোট কাপড়ের দোকান থেকে এখন অনলাইনে মাসে ৫০ হাজার টাকার বেশি বিক্রি হচ্ছে। এই প্ল্যাটফর্মের কারণে আমার ব্যবসা অনেক বেড়েছে!",
    rating: 5,
    avatar: "https://res.cloudinary.com/funnelsninja/image/upload/v1757228345/3_du0yd6.jpg"
  },
  {
    name: "সালমা খাতুন",
    business: "হোম মেইড ফুড",
    revenue: "৩৫,০০০ টাকা+ মাসিক",
    content: "ঘরে বসে রান্না করে এখন অনলাইনে বিক্রি করছি। ৩ মাসেই আমার অর্ডার ৩ গুণ বেড়েছে। খুবই সহজ এবং কার্যকর সিস্টেম!",
    rating: 5,
    avatar: "https://res.cloudinary.com/funnelsninja/image/upload/v1757228345/4_cdrapd.jpg"
  },
  {
    name: "রাসেল শিকদার ",
    business: "ইলেকট্রনিক্স শপ",
    revenue: "৭৫,০০০ টাকা+ মাসিক",
    content: "আমার মোবাইল ও ইলেকট্রনিক্সের দোকান এখন অনলাইনেও চলছে। গ্রাহকরা খুবই সন্তুষ্ট এবং প্রতিদিন নতুন অর্ডার আসছে।",
    rating: 5,
    avatar: "https://res.cloudinary.com/funnelsninja/image/upload/v1757228830/7_xqdirn.jpg"
  },
  {
    name: "নাসরিন জাহান",
    business: "ফ্যাশন বুটিক শপ",
    revenue: "৪২,০০০ টাকা+ মাসিক",
    content: "হাতে বানানো গহনা বিক্রি করে এখন মাসে ৪০ হাজারের বেশি আয় হচ্ছে। এই ওয়েবসাইটের মাধ্যমে দেশের যেকোনো প্রান্তে পৌঁছে যাচ্ছি।",
    rating: 5,
    avatar: "https://res.cloudinary.com/funnelsninja/image/upload/v1757228345/5_blrfhq.jpg"
  },
  {
    name: "মোঃ ফারুক হোসেন",
    business: "বইয়ের দোকান",
    revenue: "২৮,০০০ টাকা+ মাসিক",
    content: "আমার বইয়ের দোকান এখন অনলাইনে চালু হয়েছে। স্টুডেন্টরা সহজেই বই অর্ডার করতে পারছে। মাসে প্রায় ৩০ হাজার টাকার বিক্রি হচ্ছে।",
    rating: 5,
    avatar: "https://res.cloudinary.com/funnelsninja/image/upload/v1757228344/2_oyjc1b.jpg"
  },
  {
    name: "ফারিয়া আক্তার নিপা",
    business: "হেলথ সাপ্লিমেন্ট",
    revenue: "৬৮,০০০ টাকা+ মাসিক",
    content: "স্বাস্থ্য সম্পর্কিত পণ্য বিক্রি করে খুবই ভালো রেসপন্স পাচ্ছি। গ্রাহকরা নিয়মিত অর্ডার করছেন এবং রেটিং দিচ্ছেন। আয় প্রতি মাসে বাড়ছে।",
    rating: 5,
    avatar: "https://res.cloudinary.com/funnelsninja/image/upload/v1757228345/6_fal4cs.jpg"
  }
];

export const Testimonials = () => {
  return (
    <TooltipProvider>
      <section id="testimonials" className="py-20 bg-background">
        <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Real Stories, <span className="text-accent">Real Results</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how entrepreneurs like you are building profitable online businesses with our platform
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-8 hover:shadow-medium transition-all duration-300 border-border/50 hover:border-accent/30 bg-gradient-card relative">
              
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 h-8 w-8 text-accent/20" />
              
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-accent fill-current" />
                ))}
              </div>
              
              {/* Content */}
              <p className="text-foreground leading-relaxed mb-6 italic">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger>
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>গোপনীয়তার জন্য আমরা গ্রাহকদের আসল ছবি ব্যবহার করিনি</p>
                  </TooltipContent>
                </Tooltip>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.business}</div>
                  <div className="text-sm text-accent font-medium">{testimonial.revenue}</div>
                </div>
              </div>
              
            </Card>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 backdrop-blur-sm border border-accent/20 rounded-full px-6 py-3">
            <Star className="h-5 w-5 text-accent fill-current" />
            <span className="text-foreground font-medium">
              ৪.৯/৫ রেটিং - ২৫০+ সন্তুষ্ট গ্রাহক
            </span>
          </div>
        </div>

        </div>
      </section>
    </TooltipProvider>
  );
};