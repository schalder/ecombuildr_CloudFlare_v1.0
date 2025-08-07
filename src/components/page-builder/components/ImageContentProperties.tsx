import React from 'react';
import { PageBuilderElement } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const ImageContentProperties: React.FC<ImageContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { uploadMethod = 'url', url = '', alt = '', caption = '', alignment = 'center', linkUrl = '', linkTarget = '_self' } = element.content;
  const [urlPreview, setUrlPreview] = React.useState('');

  // Update URL preview when URL changes
  React.useEffect(() => {
    if (uploadMethod === 'url' && url) {
      setUrlPreview(url);
    }
  }, [url, uploadMethod]);

  const handleUrlChange = (newUrl: string) => {
    onUpdate('url', newUrl);
    setUrlPreview(newUrl);
  };

  return (
    <div className="space-y-6">
      <Tabs value={uploadMethod} onValueChange={(value) => onUpdate('uploadMethod', value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">External URL</TabsTrigger>
          <TabsTrigger value="upload">Upload File</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="space-y-4">
          <div>
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {urlPreview && (
              <div className="mt-2">
                <img 
                  src={urlPreview} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded border"
                  onError={() => setUrlPreview('')}
                />
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4">
          <ImageUpload
            value={url}
            onChange={(newUrl) => {
              onUpdate('url', newUrl);
              onUpdate('uploadMethod', 'upload');
            }}
            label="Upload Image"
            accept="image/*"
            maxSize={5}
          />
        </TabsContent>
      </Tabs>

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