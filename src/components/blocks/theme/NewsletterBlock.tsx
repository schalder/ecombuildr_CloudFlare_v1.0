import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BlockEditProps, BlockSaveProps } from '../types';
import { Settings, Trash2, Copy, Mail } from 'lucide-react';

interface NewsletterContent {
  title: string;
  subtitle: string;
  placeholder?: string;
  buttonText?: string;
}

export const NewsletterEdit: React.FC<BlockEditProps> = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  isSelected, 
  onSelect 
}) => {
  const content = block.content as NewsletterContent;

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
          <span className="text-sm font-medium">Newsletter</span>
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
                placeholder="Newsletter title"
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={content.subtitle}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                placeholder="Newsletter description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="placeholder">Email Placeholder</Label>
              <Input
                id="placeholder"
                value={content.placeholder || 'Enter your email'}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                placeholder="Email input placeholder"
              />
            </div>
            <div>
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={content.buttonText || 'Subscribe'}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
                placeholder="Subscribe button text"
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      <NewsletterSave block={block} />
    </div>
  );
};

export const NewsletterSave: React.FC<BlockSaveProps> = ({ block }) => {
  const content = block.content as NewsletterContent;

  return (
    <section className="py-16 bg-primary/5">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            {content.title}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {content.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder={content.placeholder || 'Enter your email'}
              className="flex-1"
            />
            <Button size="lg" className="px-8">
              {content.buttonText || 'Subscribe'}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export const newsletterBlock = {
  name: 'newsletter',
  settings: {
    name: 'newsletter',
    title: 'Newsletter Signup',
    icon: Mail,
    category: 'interactive' as const,
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: NewsletterEdit,
  save: NewsletterSave,
};