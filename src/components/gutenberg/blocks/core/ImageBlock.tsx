import React, { useState, useRef } from 'react';
import { ImageIcon, Upload, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { GutenbergBlockEditProps, GutenbergBlockSaveProps } from '../../types';

const ImageEdit: React.FC<GutenbergBlockEditProps> = ({
  block,
  isSelected,
  setAttributes
}) => {
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const src = block.content.src || '';
  const alt = block.content.alt || '';
  const caption = block.content.caption || '';
  const alignment = block.content.alignment || 'center';
  const width = block.content.width || 'auto';
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttributes({ 
          src: e.target?.result as string,
          alt: alt || file.name 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setAttributes({ src: urlInput.trim() });
      setUrlInput('');
      setIsUrlMode(false);
    }
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttributes({ caption: e.target.value });
  };

  const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttributes({ alt: e.target.value });
  };

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'left': return 'mr-auto';
      case 'right': return 'ml-auto';
      case 'center': return 'mx-auto';
      default: return 'mx-auto';
    }
  };

  // If no image is selected, show upload interface
  if (!src) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/25 p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Add an image</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload an image or paste a URL
            </p>
          </div>

          {isUrlMode ? (
            <div className="space-y-3 max-w-md mx-auto">
              <Input
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUrlSubmit}>
                  Add Image
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsUrlMode(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button variant="outline" onClick={() => setIsUrlMode(true)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Insert from URL
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </Card>
    );
  }

  // Image is selected, show the image with controls
  return (
    <div className="space-y-4">
      <div className={`max-w-full ${getAlignmentClass()}`}>
        <img
          src={src}
          alt={alt}
          className={`
            max-w-full h-auto rounded-lg
            ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
          `}
          style={{ width: width !== 'auto' ? `${width}px` : 'auto' }}
        />
      </div>

      {/* Image controls */}
      {isSelected && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="alt-text" className="text-xs">Alt text (required)</Label>
              <Input
                id="alt-text"
                placeholder="Describe this image..."
                value={alt}
                onChange={handleAltChange}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="caption" className="text-xs">Caption</Label>
              <Input
                id="caption"
                placeholder="Optional caption..."
                value={caption}
                onChange={handleCaptionChange}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3 h-3 mr-1" />
              Replace
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setAttributes({ src: '', alt: '', caption: '' })}
            >
              Remove
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Caption display */}
      {caption && (
        <p className="text-sm text-muted-foreground text-center italic">
          {caption}
        </p>
      )}
    </div>
  );
};

const ImageSave: React.FC<GutenbergBlockSaveProps> = ({ block }) => {
  const src = block.content.src || '';
  const alt = block.content.alt || '';
  const caption = block.content.caption || '';
  const alignment = block.content.alignment || 'center';
  const width = block.content.width || 'auto';

  if (!src) return null;

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'left': return 'mr-auto';
      case 'right': return 'ml-auto';
      case 'center': return 'mx-auto';
      default: return 'mx-auto';
    }
  };

  return (
    <figure className={`space-y-2 ${getAlignmentClass()}`}>
      <img
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-lg"
        style={{ width: width !== 'auto' ? `${width}px` : 'auto' }}
      />
      {caption && (
        <figcaption className="text-sm text-muted-foreground text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export const imageBlock = {
  name: 'core/image',
  settings: {
    name: 'core/image',
    title: 'Image',
    icon: ImageIcon,
    category: 'media' as const,
    description: 'Insert an image to make a visual statement.',
    keywords: ['image', 'photo', 'picture'],
    supports: {
      align: true,
      spacing: true,
      className: true,
    }
  },
  edit: ImageEdit,
  save: ImageSave
};