import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BlockEditProps, BlockSaveProps } from '../types';
import { Settings, Trash2, Copy } from 'lucide-react';

interface HeroTechContent {
  title: string;
  subtitle: string;
  cta: string;
  background: 'gradient' | 'solid';
  layout: 'center' | 'left';
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
        <div className="absolute top-0 right-0 w-80 bg-background border rounded-lg p-4 shadow-lg z-20">
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

  return (
    <section className="relative min-h-[500px] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
      {/* Geometric Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rotate-45 rounded-lg"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-accent/10 rotate-12 rounded-lg"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-secondary/5 rounded-full"></div>
      </div>

      <div className="container relative z-10">
        <div className={`max-w-4xl ${content.layout === 'center' ? 'mx-auto text-center' : 'text-left'}`}>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {content.title}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl">
            {content.subtitle}
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          >
            {content.cta}
          </Button>
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