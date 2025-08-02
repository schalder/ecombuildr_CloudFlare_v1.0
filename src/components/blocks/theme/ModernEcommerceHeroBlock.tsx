import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import { BlockEditProps, BlockSaveProps, BlockRegistration } from '../types';
import { Zap, ShoppingCart, Search, Heart, User } from 'lucide-react';

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

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-[80vh] flex items-center">
      {content.backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${content.backgroundImage})` }}
        />
      )}
      
      {/* Header Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold">CommunityHQ</div>
          
          <div className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Products</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Categories</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4" />
            </Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
            </Button>
          </div>
        </nav>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {content.title || 'Welcome to CommunityHQ'}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {content.subtitle || 'Discover cutting-edge VR technology and immersive experiences that transport you to new worlds'}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                className="w-full pl-12 pr-4 py-6 text-lg rounded-full border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                placeholder={content.searchPlaceholder || 'Search for VR headsets, accessories, games...'}
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-orange-500 hover:bg-orange-600">
                Search
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-full">
              <Zap className="w-5 h-5 mr-2" />
              {content.ctaPrimary || 'Shop VR Collection'}
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg rounded-full border-2">
              {content.ctaSecondary || 'Watch Demo'}
            </Button>
          </div>

          {/* Featured Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">1000+</div>
              <div className="text-gray-600">VR Experiences</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">50K+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">24/7</div>
              <div className="text-gray-600">Support</div>
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