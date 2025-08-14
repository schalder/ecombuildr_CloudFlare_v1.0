import { Card } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    business: "Boutique Fashion Store",
    revenue: "$50K+ monthly",
    content: "EcomBuildr transformed my Instagram business into a professional e-commerce store. Sales increased by 400% in the first 3 months!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Mike Chen",
    business: "Electronics Retailer",
    revenue: "$75K+ monthly",
    content: "The conversion optimization tools are incredible. Our cart abandonment dropped by 60% and average order value increased by 35%.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Amanda Rodriguez",
    business: "Health & Wellness",
    revenue: "$30K+ monthly",
    content: "Finally, a platform that understands conversion. The templates are designed to sell, not just look pretty. ROI was immediate.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
  }
];

export const Testimonials = () => {
  return (
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
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
              4.9/5 rating from 2,500+ verified customers
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};