import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MediaSelector } from './MediaSelector';
import { PageBuilderElement, ElementVisibility } from '../types';
import { VisibilityControl } from './VisibilityControl';

interface ImageFeatureContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const ImageFeatureContentProperties: React.FC<ImageFeatureContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const headline = element.content.headline || 'Feature Headline';
  const description = element.content.description || 'Feature description goes here...';
  const imageUrl = element.content.imageUrl || '';
  const altText = element.content.altText || '';
  const imagePosition = element.content.imagePosition || 'left';
  const imageWidth = element.content.imageWidth || 25;
  
  // Default visibility settings
  const defaultVisibility: ElementVisibility = {
    desktop: true,
    tablet: true,
    mobile: true
  };

  const currentVisibility = element.visibility || defaultVisibility;

  const handleVisibilityChange = (visibility: ElementVisibility) => {
    onUpdate('visibility', visibility);
  };

  return (
    <div className="space-y-4">
      <VisibilityControl
        visibility={currentVisibility}
        onVisibilityChange={handleVisibilityChange}
      />
      <div>
        <Label htmlFor="headline">Feature Headline</Label>
        <Input
          id="headline"
          value={headline}
          onChange={(e) => onUpdate('headline', e.target.value)}
          placeholder="Enter headline..."
        />
      </div>

      <div>
        <Label htmlFor="description">Feature Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Enter description..."
          rows={3}
        />
      </div>

      <div>
        <Label>Feature Image</Label>
        <MediaSelector
          value={imageUrl}
          onChange={(url) => onUpdate('imageUrl', url)}
          label="Select Feature Image"
        />
      </div>

      <div>
        <Label htmlFor="alt-text">Alt Text</Label>
        <Input
          id="alt-text"
          value={altText}
          onChange={(e) => onUpdate('altText', e.target.value)}
          placeholder="Describe the image..."
        />
      </div>

      <div>
        <Label htmlFor="image-position">Image Position</Label>
        <Select value={imagePosition} onValueChange={(value) => onUpdate('imagePosition', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Image Width (%)</Label>
        <div className="flex items-center space-x-2">
          <Slider
            value={[imageWidth]}
            onValueChange={(value) => onUpdate('imageWidth', value[0])}
            max={80}
            min={20}
            step={5}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-12">
            {imageWidth}%
          </span>
        </div>
      </div>
    </div>
  );
};