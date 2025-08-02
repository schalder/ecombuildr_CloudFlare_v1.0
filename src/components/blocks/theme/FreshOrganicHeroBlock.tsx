import React from 'react';
import { BlockEditProps, BlockSaveProps, BlockRegistration } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import { Badge } from '@/components/ui/badge';
import { Leaf, Search, ShoppingCart, User, Menu, Heart, Truck, Shield, Award } from 'lucide-react';

interface FreshOrganicHeroContent {
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  backgroundImage: string;
  showSearch: boolean;
  searchPlaceholder: string;
}

const FreshOrganicHeroEdit: React.FC<BlockEditProps> = ({ block, onUpdate }) => {
  const content = block.content as FreshOrganicHeroContent;

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Fresh Organic Hero</h3>
      
      <div>
        <Label htmlFor="title">Main Title</Label>
        <Input
          id="title"
          value={content.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Fresh & Organic"
        />
      </div>

      <div>
        <Label htmlFor="subtitle">Subtitle</Label>
        <Textarea
          id="subtitle"
          value={content.subtitle || ''}
          onChange={(e) => onUpdate({ subtitle: e.target.value })}
          placeholder="Discover farm-fresh organic products..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ctaPrimary">Primary CTA</Label>
          <Input
            id="ctaPrimary"
            value={content.ctaPrimary || ''}
            onChange={(e) => onUpdate({ ctaPrimary: e.target.value })}
            placeholder="Shop Fresh"
          />
        </div>
        <div>
          <Label htmlFor="ctaSecondary">Secondary CTA</Label>
          <Input
            id="ctaSecondary"
            value={content.ctaSecondary || ''}
            onChange={(e) => onUpdate({ ctaSecondary: e.target.value })}
            placeholder="Learn More"
          />
        </div>
      </div>

      <div>
        <Label>Background Image</Label>
        <ImageUpload
          value={content.backgroundImage || ''}
          onChange={(url) => onUpdate({ backgroundImage: url })}
          accept="image/*"
        />
      </div>

      <div>
        <Label htmlFor="searchPlaceholder">Search Placeholder</Label>
        <Input
          id="searchPlaceholder"
          value={content.searchPlaceholder || ''}
          onChange={(e) => onUpdate({ searchPlaceholder: e.target.value })}
          placeholder="Search organic products..."
        />
      </div>
    </div>
  );
};

const FreshOrganicHeroSave: React.FC<BlockSaveProps> = ({ block }) => {
  const content = block.content as FreshOrganicHeroContent;
  
  const backgroundStyle = content.backgroundImage 
    ? { backgroundImage: `url(${content.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)' };

  return (
    <section className="relative min-h-screen flex flex-col" style={backgroundStyle}>
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <span className="text-green-800 font-bold text-2xl">FreshMarket</span>
            </div>
            <div className="hidden lg:flex space-x-8">
              <a href="#" className="text-green-700 hover:text-green-600 transition-colors font-medium">Fresh Produce</a>
              <a href="#" className="text-green-700 hover:text-green-600 transition-colors font-medium">Organic</a>
              <a href="#" className="text-green-700 hover:text-green-600 transition-colors font-medium">Dairy</a>
              <a href="#" className="text-green-700 hover:text-green-600 transition-colors font-medium">Pantry</a>
              <a href="#" className="text-green-700 hover:text-green-600 transition-colors font-medium">About</a>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar in Navigation */}
            {content.showSearch && (
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 h-4 w-4" />
                <Input 
                  placeholder={content.searchPlaceholder || 'Search organic products...'}
                  className="pl-10 w-64 border-green-200 focus:border-green-500"
                />
              </div>
            )}
            
            <Button variant="ghost" size="icon" className="text-green-700 hover:bg-green-50">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-green-700 hover:bg-green-50">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-green-700 hover:bg-green-50 relative">
              <ShoppingCart className="h-5 w-5" />
              <Badge className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                5
              </Badge>
            </Button>
            <Button variant="ghost" size="icon" className="text-green-700 hover:bg-green-50 lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2 text-sm font-medium">
                  100% Organic & Fresh
                </Badge>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-green-900 leading-tight">
                  {content.title || 'Farm Fresh Organic'}
                </h1>
                <p className="text-xl text-green-700 leading-relaxed max-w-lg">
                  {content.subtitle || 'Discover the finest organic produce, delivered fresh from local farms to your doorstep. Pure, natural, and sustainably grown.'}
                </p>
              </div>
              
              {/* Mobile Search */}
              {content.showSearch && (
                <div className="md:hidden">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 h-5 w-5" />
                    <Input 
                      placeholder={content.searchPlaceholder || 'Search organic products...'}
                      className="pl-10 h-12 border-green-200 focus:border-green-500"
                    />
                  </div>
                </div>
              )}
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold">
                  {content.ctaPrimary || 'Shop Fresh Now'}
                </Button>
                <Button variant="outline" size="lg" className="text-green-700 border-green-300 hover:bg-green-50 px-8 py-4 text-lg">
                  {content.ctaSecondary || 'Learn More'}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-green-200">
                <div className="text-center">
                  <Truck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-green-800">Free Delivery</div>
                  <div className="text-xs text-green-600">Orders over $50</div>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-green-800">Certified Organic</div>
                  <div className="text-xs text-green-600">USDA Approved</div>
                </div>
                <div className="text-center">
                  <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-green-800">Farm Fresh</div>
                  <div className="text-xs text-green-600">Locally Sourced</div>
                </div>
              </div>
            </div>

            {/* Right Content - Product Showcase */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {/* Fresh Produce Cards */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="w-full h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-xl mb-4 flex items-center justify-center">
                      <span className="text-4xl">🥬</span>
                    </div>
                    <h3 className="font-semibold text-green-800">Fresh Lettuce</h3>
                    <p className="text-green-600 text-sm">Organic & Crisp</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-bold text-green-700">$3.99</span>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">Add</Button>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl mb-4 flex items-center justify-center">
                      <span className="text-4xl">🥕</span>
                    </div>
                    <h3 className="font-semibold text-green-800">Carrots</h3>
                    <p className="text-green-600 text-sm">Farm Fresh</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-bold text-green-700">$2.49</span>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">Add</Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 mt-8">
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="w-full h-32 bg-gradient-to-br from-red-100 to-red-200 rounded-xl mb-4 flex items-center justify-center">
                      <span className="text-4xl">🍅</span>
                    </div>
                    <h3 className="font-semibold text-green-800">Tomatoes</h3>
                    <p className="text-green-600 text-sm">Vine Ripened</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-bold text-green-700">$4.99</span>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">Add</Button>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="w-full h-32 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl mb-4 flex items-center justify-center">
                      <span className="text-4xl">🌽</span>
                    </div>
                    <h3 className="font-semibold text-green-800">Sweet Corn</h3>
                    <p className="text-green-600 text-sm">Local Farm</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-bold text-green-700">$1.99</span>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">Add</Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                Fresh Today
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-sm text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                Same Day Delivery
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const freshOrganicHeroBlock: BlockRegistration = {
  name: 'fresh_organic_hero',
  settings: {
    name: 'fresh_organic_hero',
    title: 'Fresh Organic Hero',
    icon: Leaf,
    category: 'marketing',
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: FreshOrganicHeroEdit,
  save: FreshOrganicHeroSave,
};