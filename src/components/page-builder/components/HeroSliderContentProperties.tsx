import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Move } from 'lucide-react';
import { PageBuilderElement } from '../types';
import { MediaSelector } from './MediaSelector';

interface HeroSliderContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

interface Slide {
  id: string;
  subHeadline?: string;
  headline: string;
  paragraph?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonType?: 'url' | 'page' | 'action';
  image?: string;
  imageAlt?: string;
}

export const HeroSliderContentProperties: React.FC<HeroSliderContentPropertiesProps> = ({
  element,
  onUpdate,
}) => {
  const content = element.content as any;
  const slides = content?.slides || [];

  const addSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      headline: 'New Slide Title',
      paragraph: 'Add your slide description here',
      buttonText: 'Learn More',
      buttonUrl: '#',
      buttonType: 'url',
    };
    
    onUpdate('slides', [...slides, newSlide]);
  };

  const updateSlide = (slideId: string, property: string, value: any) => {
    const updatedSlides = slides.map((slide: Slide) =>
      slide.id === slideId ? { ...slide, [property]: value } : slide
    );
    onUpdate('slides', updatedSlides);
  };

  const removeSlide = (slideId: string) => {
    const updatedSlides = slides.filter((slide: Slide) => slide.id !== slideId);
    onUpdate('slides', updatedSlides);
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const updatedSlides = [...slides];
    [updatedSlides[index], updatedSlides[newIndex]] = [updatedSlides[newIndex], updatedSlides[index]];
    onUpdate('slides', updatedSlides);
  };

  return (
    <div className="space-y-6">
      {/* Layout Settings */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Layout</h4>
        
        <div>
          <Label className="text-xs">Layout Type</Label>
          <Select
            value={content?.layout || 'overlay'}
            onValueChange={(value) => onUpdate('layout', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overlay">Image Overlay</SelectItem>
              <SelectItem value="side-by-side">Side by Side</SelectItem>
              <SelectItem value="text-only">Text Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Text Alignment</Label>
          <Select
            value={content?.textAlignment || 'left'}
            onValueChange={(value) => onUpdate('textAlignment', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {content?.layout === 'overlay' && (
          <div>
            <Label className="text-xs">Overlay Opacity (%)</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Slider
                value={[content?.overlayOpacity || 50]}
                onValueChange={(value) => onUpdate('overlayOpacity', value[0])}
                max={100}
                min={0}
                step={5}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {content?.overlayOpacity || 50}%
              </span>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Slider Settings */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Slider Settings</h4>
        
        <div className="flex items-center justify-between">
          <Label className="text-xs">Autoplay</Label>
          <Switch
            checked={content?.autoplay || false}
            onCheckedChange={(checked) => onUpdate('autoplay', checked)}
          />
        </div>

        {content?.autoplay && (
          <div>
            <Label className="text-xs">Autoplay Delay (seconds)</Label>
            <Input
              type="number"
              value={content?.autoplayDelay || 5}
              onChange={(e) => onUpdate('autoplayDelay', parseInt(e.target.value) || 5)}
              min={1}
              max={30}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label className="text-xs">Loop</Label>
          <Switch
            checked={content?.loop !== false}
            onCheckedChange={(checked) => onUpdate('loop', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Navigation Arrows</Label>
          <Switch
            checked={content?.showArrows !== false}
            onCheckedChange={(checked) => onUpdate('showArrows', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Dots</Label>
          <Switch
            checked={content?.showDots !== false}
            onCheckedChange={(checked) => onUpdate('showDots', checked)}
          />
        </div>
      </div>

      <Separator />

      {/* Slides Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Slides ({slides.length})
          </h4>
          <Button size="sm" onClick={addSlide} className="h-8">
            <Plus className="h-3 w-3 mr-1" />
            Add Slide
          </Button>
        </div>

        {slides.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No slides added yet</p>
            <Button size="sm" onClick={addSlide} className="mt-2">
              Add Your First Slide
            </Button>
          </div>
        )}

        {slides.map((slide: Slide, index: number) => (
          <Card key={slide.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium">Slide {index + 1}</h5>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveSlide(index, 'up')}
                  disabled={index === 0}
                >
                  <Move className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeSlide(slide.id)}
                  disabled={slides.length === 1}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs">Sub Headline (Optional)</Label>
              <Input
                value={slide.subHeadline || ''}
                onChange={(e) => updateSlide(slide.id, 'subHeadline', e.target.value)}
                placeholder="e.g., NEW ARRIVAL"
              />
            </div>

            <div>
              <Label className="text-xs">Headline</Label>
              <Input
                value={slide.headline}
                onChange={(e) => updateSlide(slide.id, 'headline', e.target.value)}
                placeholder="Enter slide title"
              />
            </div>

            <div>
              <Label className="text-xs">Paragraph (Optional)</Label>
              <Textarea
                value={slide.paragraph || ''}
                onChange={(e) => updateSlide(slide.id, 'paragraph', e.target.value)}
                placeholder="Enter slide description"
                rows={2}
              />
            </div>

            {(content?.layout !== 'text-only') && (
              <div>
                <MediaSelector
                  label="Slide Image"
                  value={slide.image || ''}
                  onChange={(url) => updateSlide(slide.id, 'image', url)}
                />
              </div>
            )}

            {slide.image && (
              <div>
                <Label className="text-xs">Image Alt Text</Label>
                <Input
                  value={slide.imageAlt || ''}
                  onChange={(e) => updateSlide(slide.id, 'imageAlt', e.target.value)}
                  placeholder="Describe the image"
                />
              </div>
            )}

            <div>
              <Label className="text-xs">Button Text (Optional)</Label>
              <Input
                value={slide.buttonText || ''}
                onChange={(e) => updateSlide(slide.id, 'buttonText', e.target.value)}
                placeholder="e.g., Learn More"
              />
            </div>

            {slide.buttonText && (
              <>
                <div>
                  <Label className="text-xs">Button Action</Label>
                  <Select
                    value={slide.buttonType || 'url'}
                    onValueChange={(value) => updateSlide(slide.id, 'buttonType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">External URL</SelectItem>
                      <SelectItem value="page">Internal Page</SelectItem>
                      <SelectItem value="action">Custom Action</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">
                    {slide.buttonType === 'url' ? 'URL' : 'Action/Page'}
                  </Label>
                  <Input
                    value={slide.buttonUrl || ''}
                    onChange={(e) => updateSlide(slide.id, 'buttonUrl', e.target.value)}
                    placeholder={slide.buttonType === 'url' ? 'https://example.com' : 'Enter action or page path'}
                  />
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};