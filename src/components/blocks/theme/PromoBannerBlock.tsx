import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';
import { BlockEditProps, BlockSaveProps } from '../types';
import { Settings, Trash2, Copy, Gift } from 'lucide-react';

interface PromoBannerContent {
  title: string;
  subtitle: string;
  cta: string;
  ctaUrl: string;
  background: 'gradient' | 'solid' | 'image';
  backgroundImage?: string;
  backgroundColor: string;
  textColor: string;
  style: 'minimal' | 'bold' | 'elegant';
  showIcon: boolean;
}

export const PromoBannerEdit: React.FC<BlockEditProps> = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  isSelected, 
  onSelect 
}) => {
  const content = block.content as PromoBannerContent;

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
          <span className="text-sm font-medium">Promotional Banner</span>
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
                placeholder="Promo title"
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={content.subtitle}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                placeholder="Promo description"
                rows={2}
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
              <Label htmlFor="cta-url">CTA URL</Label>
              <Input
                id="cta-url"
                value={content.ctaUrl}
                onChange={(e) => onUpdate({ ctaUrl: e.target.value })}
                placeholder="/products"
              />
            </div>
            <div>
              <Label>Style</Label>
              <Select
                value={content.style}
                onValueChange={(value) => onUpdate({ style: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="elegant">Elegant</SelectItem>
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
            {content.background === 'solid' && (
              <div>
                <Label htmlFor="bg-color">Background Color</Label>
                <Input
                  id="bg-color"
                  type="color"
                  value={content.backgroundColor}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                />
              </div>
            )}
            {content.background === 'image' && (
              <ImageUpload
                label="Background Image"
                value={content.backgroundImage}
                onChange={(url) => onUpdate({ backgroundImage: url })}
              />
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="show-icon"
                checked={content.showIcon}
                onCheckedChange={(checked) => onUpdate({ showIcon: checked })}
              />
              <Label htmlFor="show-icon">Show icon</Label>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      <PromoBannerSave block={block} />
    </div>
  );
};

export const PromoBannerSave: React.FC<BlockSaveProps> = ({ block }) => {
  const content = block.content as PromoBannerContent;

  const getBackgroundStyle = () => {
    if (content.background === 'image' && content.backgroundImage) {
      return {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${content.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    if (content.background === 'solid') {
      return { backgroundColor: content.backgroundColor || '#3B82F6' };
    }
    return {};
  };

  const getStyleClasses = () => {
    switch (content.style) {
      case 'bold':
        return 'py-16 bg-gradient-to-r from-orange-500 to-pink-500 text-white';
      case 'elegant':
        return 'py-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white';
      default:
        return 'py-10 bg-gradient-to-r from-primary to-accent text-white';
    }
  };

  return (
    <section 
      className={`relative ${
        content.background === 'gradient' ? getStyleClasses() : 'py-10 text-white'
      }`}
      style={content.background !== 'gradient' ? getBackgroundStyle() : {}}
    >
      <div className="container">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            {content.showIcon && (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
            )}
            <h2 className={`font-bold ${
              content.style === 'bold' ? 'text-4xl md:text-5xl' : 
              content.style === 'elegant' ? 'text-3xl md:text-4xl font-serif' :
              'text-2xl md:text-3xl'
            }`}>
              {content.title}
            </h2>
          </div>
          
          {content.subtitle && (
            <p className={`mb-8 ${
              content.style === 'bold' ? 'text-xl' : 'text-lg'
            } opacity-90`}>
              {content.subtitle}
            </p>
          )}
          
          {content.cta && (
            <Button 
              size="lg"
              className={`px-8 py-4 text-lg font-semibold ${
                content.style === 'elegant' 
                  ? 'bg-white text-purple-600 hover:bg-gray-100' 
                  : 'bg-white text-primary hover:bg-gray-100'
              } shadow-lg hover:shadow-xl transition-all`}
            >
              {content.cta}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export const promoBannerBlock = {
  name: 'promo_banner',
  settings: {
    name: 'promo_banner',
    title: 'Promotional Banner',
    icon: Gift,
    category: 'marketing' as const,
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: PromoBannerEdit,
  save: PromoBannerSave,
};