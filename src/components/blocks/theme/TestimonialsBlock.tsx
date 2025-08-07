import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { BlockEditProps, BlockSaveProps } from '../types';
import { Settings, Trash2, Copy, Quote, Plus, X } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
}

interface TestimonialsContent {
  title: string;
  subtitle: string;
  testimonials: Testimonial[];
  layout: 'carousel' | 'grid';
  showRating: boolean;
}

export const TestimonialsEdit: React.FC<BlockEditProps> = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  isSelected, 
  onSelect 
}) => {
  const content = block.content as TestimonialsContent;

  const addTestimonial = () => {
    const newTestimonial: Testimonial = {
      name: '',
      role: '',
      company: '',
      content: '',
      rating: 5
    };
    onUpdate({ 
      testimonials: [...(content.testimonials || []), newTestimonial] 
    });
  };

  const updateTestimonial = (index: number, updates: Partial<Testimonial>) => {
    const updatedTestimonials = content.testimonials.map((testimonial, i) => 
      i === index ? { ...testimonial, ...updates } : testimonial
    );
    onUpdate({ testimonials: updatedTestimonials });
  };

  const removeTestimonial = (index: number) => {
    const updatedTestimonials = content.testimonials.filter((_, i) => i !== index);
    onUpdate({ testimonials: updatedTestimonials });
  };

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
          <span className="text-sm font-medium">Testimonials</span>
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
        <div className="absolute top-0 right-0 w-96 bg-background border rounded-lg p-4 shadow-lg z-20 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Section Title</Label>
              <Input
                id="title"
                value={content.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="What Our Customers Say"
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={content.subtitle}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                placeholder="Hear from our satisfied customers"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Testimonials</Label>
              <Button variant="outline" size="sm" onClick={addTestimonial}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            {content.testimonials?.map((testimonial, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Testimonial {index + 1}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeTestimonial(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <Input
                  value={testimonial.name}
                  onChange={(e) => updateTestimonial(index, { name: e.target.value })}
                  placeholder="Customer name"
                  className="text-sm"
                />
                <Input
                  value={testimonial.role}
                  onChange={(e) => updateTestimonial(index, { role: e.target.value })}
                  placeholder="Role/Title"
                  className="text-sm"
                />
                <Textarea
                  value={testimonial.content}
                  onChange={(e) => updateTestimonial(index, { content: e.target.value })}
                  placeholder="Testimonial content"
                  rows={2}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <TestimonialsSave block={block} />
    </div>
  );
};

export const TestimonialsSave: React.FC<BlockSaveProps> = ({ block }) => {
  const content = block.content as TestimonialsContent;

  if (!content.testimonials || content.testimonials.length === 0) {
    return (
      <section className="py-16 bg-muted/50">
        <div className="container text-center">
          <p className="text-muted-foreground">No testimonials configured</p>
        </div>
      </section>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </div>
    ));
  };

  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {content.title}
          </h2>
          {content.subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {content.subtitle}
            </p>
          )}
        </div>

        <div className={`grid gap-8 ${
          content.layout === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 lg:grid-cols-2 max-w-4xl mx-auto'
        }`}>
          {content.testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {content.showRating && (
                <div className="flex items-center gap-1 mb-4">
                  {renderStars(testimonial.rating)}
                </div>
              )}
              
              <div className="mb-4">
                <Quote className="w-8 h-8 text-primary/20 mb-2" />
                <p className="text-muted-foreground leading-relaxed">
                  "{testimonial.content}"
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}{testimonial.company && `, ${testimonial.company}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const testimonialsBlock = {
  name: 'testimonials',
  settings: {
    name: 'testimonials',
    title: 'Testimonials',
    icon: Quote,
    category: 'interactive' as const,
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: TestimonialsEdit,
  save: TestimonialsSave,
};