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

interface HeroTechContent {
  title: string;
  subtitle: string;
  cta: string;
  background: 'gradient' | 'solid' | 'image';
  backgroundImage?: string;
  layout: 'center' | 'left';
  showImage: boolean;
  image?: string;
}

export const HeroTechEdit: React.FC<BlockEditProps> = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  isSelected, 
  onSelect 
}) => {
  const content = block.content as HeroTechContent;

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
          <span className="text-sm font-medium">Tech Hero</span>
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
      <HeroTechSave block={block} />
    </div>
  );
};

export const HeroTechSave: React.FC<BlockSaveProps> = ({ block }) => {
  const content = block.content as HeroTechContent;

  const getBackgroundStyle = () => {
    if (content.background === 'image' && content.backgroundImage) {
      return {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${content.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    if (content.background === 'solid') {
      return { backgroundColor: '#1F2937' };
    }
    return {};
  };

  return (
    <section 
      className={`relative min-h-[500px] flex items-center justify-center overflow-hidden ${
        content.background === 'gradient' ? 'bg-gradient-to-br from-primary/10 via-background to-accent/10' : ''
      }`}
      style={getBackgroundStyle()}
    >
      {/* Geometric Background Elements - only show for gradient */}
      {content.background === 'gradient' && (
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rotate-45 rounded-lg"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-accent/10 rotate-12 rounded-lg"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-secondary/5 rounded-full"></div>
        </div>
      )}

      <div className="container relative z-10">
        <div className={`grid gap-12 items-center ${
          content.showImage && content.image ? 'lg:grid-cols-2' : ''
        }`}>
          <div className={content.layout === 'center' ? 'text-center' : 'text-left'}>
            <h1 className={`text-5xl md:text-7xl font-bold tracking-tight mb-6 ${
              content.background === 'image' || content.background === 'solid'
                ? 'text-white'
                : 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'
            }`}>
              {content.title}
            </h1>
            <p className={`text-xl md:text-2xl mb-8 max-w-2xl ${
              content.background === 'image' || content.background === 'solid'
                ? 'text-gray-200'
                : 'text-muted-foreground'
            } ${content.layout === 'center' ? 'mx-auto' : ''}`}>
              {content.subtitle}
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
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
        </div>
      </div>
    </section>
  );
};

export const heroTechBlock = {
  name: 'hero_tech',
  settings: {
    name: 'hero_tech',
    title: 'Tech Hero',
    icon: () => <div className="w-4 h-4 bg-primary rounded"></div>,
    category: 'layout' as const,
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: HeroTechEdit,
  save: HeroTechSave,
};