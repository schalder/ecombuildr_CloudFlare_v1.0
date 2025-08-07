import React from 'react';
import { PageBuilderElement } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaSelector } from './MediaSelector';

interface ImageContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const ImageContentProperties: React.FC<ImageContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { src = '', alt = '', caption = '', alignment = 'center', linkUrl = '', linkTarget = '_self' } = element.content;

  return (
    <div className="space-y-6">
      <MediaSelector
        value={src}
        onChange={(newUrl) => onUpdate('src', newUrl)}
        label="Image"
      />

      <div>
        <Label htmlFor="image-alt">Alt Text</Label>
        <Input
          id="image-alt"
          value={alt}
          onChange={(e) => onUpdate('alt', e.target.value)}
          placeholder="Describe the image for accessibility..."
        />
      </div>

      <div>
        <Label htmlFor="image-caption">Caption (optional)</Label>
        <Input
          id="image-caption"
          value={caption}
          onChange={(e) => onUpdate('caption', e.target.value)}
          placeholder="Image caption..."
        />
      </div>

      <div>
        <Label htmlFor="image-alignment">Alignment</Label>
        <Select value={alignment} onValueChange={(value) => onUpdate('alignment', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select alignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="full">Full Width</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label>Link Settings (optional)</Label>
        <div>
          <Label htmlFor="link-url">Link URL</Label>
          <Input
            id="link-url"
            value={linkUrl}
            onChange={(e) => onUpdate('linkUrl', e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        
        {linkUrl && (
          <div>
            <Label htmlFor="link-target">Link Target</Label>
            <Select value={linkTarget} onValueChange={(value) => onUpdate('linkTarget', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Same Tab</SelectItem>
                <SelectItem value="_blank">New Tab</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};