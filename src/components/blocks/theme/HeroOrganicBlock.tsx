import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BlockEditProps, BlockSaveProps } from '../types';
import { Settings, Trash2, Copy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';

interface HeroOrganicContent {
  title: string;
  subtitle: string;
  cta: string;
  background: 'image' | 'gradient' | 'solid';
  backgroundImage?: string;
  layout: 'left' | 'center';
  showImage: boolean;
  image?: string;
}

export const HeroOrganicEdit: React.FC<BlockEditProps> = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  isSelected, 
  onSelect 
}) => {
  const content = block.content as HeroOrganicContent;

  return (
    <div 
      className={`relative group cursor-pointer border-2 transition-all ${
        isSelected ? 'border-primary' : 'border-transparent hover:border-muted-foreground/20'
      }`}
      onClick={onSelect}
    >
      {/* Block Toolbar */}
      {isSelected && (
        <div className="absolute -top-10 left-0 flex items-center gap-2 bg-background border rounded-md px-2 py-1 z-10">
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Organic Hero</span>
          <Button variant="ghost" size="sm" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit Form */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-80 bg-background border rounded-lg p-4 shadow-lg z-20 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={content.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Hero title"
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={content.subtitle}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                placeholder="Hero subtitle"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="cta">Call to Action</Label>
              <Input
                id="cta"
                value={content.cta}
                onChange={(e) => onUpdate({ cta: e.target.value })}
                placeholder="Button text"
              />
            </div>
            <div>
              <Label>Layout</Label>
              <Select
                value={content.layout}
                onValueChange={(value) => onUpdate({ layout: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Background</Label>
              <Select
                value={content.background}
                onValueChange={(value) => onUpdate({ background: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {content.background === 'image' && (
              <ImageUpload
                label="Background Image"
                value={content.backgroundImage}
                onChange={(url) => onUpdate({ backgroundImage: url })}
              />
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="show-image"
                checked={content.showImage}
                onCheckedChange={(checked) => onUpdate({ showImage: checked })}
              />
              <Label htmlFor="show-image">Show hero image</Label>
            </div>
            {content.showImage && (
              <ImageUpload
                label="Hero Image"
                value={content.image}
                onChange={(url) => onUpdate({ image: url })}
              />
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      <HeroOrganicSave block={block} />
    </div>
  );
};

export const HeroOrganicSave: React.FC<BlockSaveProps> = ({ block }) => {
  const content = block.content as HeroOrganicContent;

  const getBackgroundStyle = () => {
    if (content.background === 'image' && content.backgroundImage) {
      return {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${content.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    if (content.background === 'solid') {
      return { backgroundColor: '#065F46' };
    }
    return {};
  };

  return (
    <section 
      className={`relative min-h-[600px] flex items-center overflow-hidden ${
        content.background === 'gradient' ? 'bg-gradient-to-br from-green-50 via-background to-emerald-50' : ''
      }`}
      style={getBackgroundStyle()}
    >
      {/* Organic Background Elements - only show for gradient */}
      {content.background === 'gradient' && (
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-green-100 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-48 h-48 bg-emerald-100 rounded-full opacity-40 blur-2xl"></div>
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-green-200 rounded-full opacity-20"></div>
        </div>
      )}

      <div className="container relative z-10">
        <div className={`grid gap-12 items-center ${
          content.showImage && content.image ? 'lg:grid-cols-2' : ''
        }`}>
          <div className={content.layout === 'center' ? 'text-center' : 'text-left'}>
            <h1 className={`text-5xl md:text-6xl font-serif font-bold mb-6 leading-tight ${
              content.background === 'image' || content.background === 'solid'
                ? 'text-white'
                : 'text-green-900'
            }`}>
              {content.title}
            </h1>
            <p className={`text-xl mb-8 leading-relaxed ${
              content.background === 'image' || content.background === 'solid'
                ? 'text-green-100'
                : 'text-green-700'
            } ${content.layout === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}>
              {content.subtitle}
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-green-600 hover:bg-green-700 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              {content.cta}
            </Button>
          </div>
          
          {content.showImage && content.image && (
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src={content.image} 
                  alt="Hero"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          
          {content.layout !== 'center' && !content.showImage && (
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-green-200 to-emerald-300 rounded-3xl flex items-center justify-center">
                <div className="text-green-800 text-center">
                  <div className="w-24 h-24 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-full"></div>
                  </div>
                  <p className="text-lg font-medium">Hero Image Placeholder</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export const heroOrganicBlock = {
  name: 'hero_organic',
  settings: {
    name: 'hero_organic',
    title: 'Organic Hero',
    icon: () => <div className="w-4 h-4 bg-green-500 rounded-full"></div>,
    category: 'layout' as const,
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: HeroOrganicEdit,
  save: HeroOrganicSave,
};