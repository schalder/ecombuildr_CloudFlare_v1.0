import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { BlockEditProps, BlockSaveProps, BlockRegistration } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ImageEdit: React.FC<BlockEditProps> = ({ block, onUpdate, isSelected }) => {
  const [url, setUrl] = useState(block.content.url || '');
  const [alt, setAlt] = useState(block.content.alt || '');
  const [caption, setCaption] = useState(block.content.caption || '');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    onUpdate({ url: newUrl, alt, caption });
  };

  const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAlt = e.target.value;
    setAlt(newAlt);
    onUpdate({ url, alt: newAlt, caption });
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCaption = e.target.value;
    setCaption(newCaption);
    onUpdate({ url, alt, caption: newCaption });
  };

  return (
    <div className={`p-4 border rounded-lg ${isSelected ? 'border-primary' : 'border-border'}`}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="image-url">Image URL</Label>
          <Input
            id="image-url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <div>
          <Label htmlFor="image-alt">Alt Text</Label>
          <Input
            id="image-alt"
            value={alt}
            onChange={handleAltChange}
            placeholder="Describe the image..."
          />
        </div>
        <div>
          <Label htmlFor="image-caption">Caption (optional)</Label>
          <Input
            id="image-caption"
            value={caption}
            onChange={handleCaptionChange}
            placeholder="Image caption..."
          />
        </div>
        {url && (
          <div className="mt-4">
            <img
              src={url}
              alt={alt}
              className="w-full h-48 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ImageSave: React.FC<BlockSaveProps> = ({ block }) => {
  const { url, alt, caption } = block.content;
  
  if (!url) return null;

  return (
    <figure className="my-4">
      <img
        src={url}
        alt={alt || ''}
        className="w-full h-auto rounded-lg"
      />
      {caption && (
        <figcaption className="text-sm text-muted-foreground mt-2 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export const imageBlock: BlockRegistration = {
  name: 'core/image',
  settings: {
    name: 'core/image',
    title: 'Image',
    icon: ImageIcon,
    category: 'media',
    supports: {
      alignment: true,
      spacing: true,
    },
  },
  edit: ImageEdit,
  save: ImageSave,
};