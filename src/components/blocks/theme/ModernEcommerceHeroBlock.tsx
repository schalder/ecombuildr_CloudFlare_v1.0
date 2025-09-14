import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import { BlockEditProps, BlockSaveProps, BlockRegistration } from '../types';
import { Zap, ShoppingCart, Search, Heart, User, Star, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ModernEcommerceHeroContent {
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  backgroundImage: string;
  showSearch: boolean;
  searchPlaceholder: string;
}

const ModernEcommerceHeroEdit: React.FC<BlockEditProps> = ({ block, onUpdate }) => {
  const content = block.content as ModernEcommerceHeroContent;

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Modern E-commerce Hero</h3>
      
      <div>
        <Label htmlFor="title">Main Title</Label>
        <Input
          id="title"
          value={content.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Welcome to our store"
        />
      </div>

      <div>
        <Label htmlFor="subtitle">Subtitle</Label>
        <Textarea
          id="subtitle"
          value={content.subtitle || ''}
          onChange={(e) => onUpdate({ subtitle: e.target.value })}
          placeholder="Discover amazing products..."
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
            placeholder="Shop Now"
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
          placeholder="Search products..."
        />
      </div>
    </div>
  );
};

const ModernEcommerceHeroSave: React.FC<BlockSaveProps> = ({ block }) => {
  const content = block.content as ModernEcommerceHeroContent;
  
  const backgroundStyle = content.backgroundImage 
    ? { backgroundImage: `url(${content.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)' };

  return (
    <section className="relative min-h-screen flex flex-col" style={backgroundStyle}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-white font-bold text-2xl">Your Store</div>
            <div className="hidden lg:flex space-x-8">
              <a href="#" className="text-white/90 hover:text-white transition-colors">Home</a>
              <a href="#" className="text-white/90 hover:text-white transition-colors">VR Headsets</a>
              <a href="#" className="text-white/90 hover:text-white transition-colors">Accessories</a>
              <a href="#" className="text-white/90 hover:text-white transition-colors">Games</a>
              <a href="#" className="text-white/90 hover:text-white transition-colors">Support</a>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar in Navigation */}
            {content.showSearch && (
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder={content.searchPlaceholder || 'Search VR products...'}
                  className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
                />
              </div>
            )}
            
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
              <ShoppingCart className="h-5 w-5" />
              <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                3
              </Badge>
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 lg:hidden">
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
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 px-3 py-1">
                  New VR Technology
                </Badge>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                  {content.title || 'Step Into Virtual Reality'}
                </h1>
                <p className="text-xl text-white/90 leading-relaxed max-w-lg">
                  {content.subtitle || 'Experience the future with our cutting-edge VR headsets and accessories. Immerse yourself in worlds beyond imagination.'}
                </p>
              </div>
              
              {/* Mobile Search */}
              {content.showSearch && (
                <div className="md:hidden">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input 
                      placeholder={content.searchPlaceholder || 'Search VR products...'}
                      className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/70"
                    />
                  </div>
                </div>
              )}
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold">
                  {content.ctaPrimary || 'Shop VR Collection'}
                </Button>
                <Button variant="outline" size="lg" className="text-white border-white/30 hover:bg-white/10 px-8 py-4 text-lg">
                  {content.ctaSecondary || 'Watch Demo'}
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">50K+</div>
                  <div className="text-sm text-white/70">Happy Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white flex items-center justify-center gap-1">
                    4.9 <Star className="h-5 w-5 fill-orange-400 text-orange-400" />
                  </div>
                  <div className="text-sm text-white/70">User Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">24/7</div>
                  <div className="text-sm text-white/70">Support</div>
                </div>
              </div>
            </div>

            {/* Right Content - Product Showcase */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Floating VR Headset Image Placeholder */}
                <div className="w-full h-96 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <div className="text-center text-white/70">
                    <div className="text-6xl mb-4">🥽</div>
                    <div className="text-lg">Featured VR Headset</div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  25% OFF
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
                  Free Shipping
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const modernEcommerceHeroBlock: BlockRegistration = {
  name: 'modern_ecommerce_hero',
  settings: {
    name: 'modern_ecommerce_hero',
    title: 'Modern E-commerce Hero',
    icon: Zap,
    category: 'marketing',
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: ModernEcommerceHeroEdit,
  save: ModernEcommerceHeroSave,
};