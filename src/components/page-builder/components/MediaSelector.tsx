import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FolderOpen, Link } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { MediaLibrary } from './MediaLibrary';

interface MediaSelectorProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export const MediaSelector: React.FC<MediaSelectorProps> = ({
  value = '',
  onChange,
  label = 'Select Image'
}) => {
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(value);
  const [urlPreview, setUrlPreview] = useState('');

  // Update URL preview when URL changes
  React.useEffect(() => {
    if (urlInput && urlInput !== value) {
      setUrlPreview(urlInput);
    } else if (value) {
      setUrlInput(value);
      setUrlPreview(value);
    }
  }, [urlInput, value]);

  const handleUrlChange = (newUrl: string) => {
    setUrlInput(newUrl);
    onChange(newUrl);
    setUrlPreview(newUrl);
  };

  const handleLibrarySelect = (url: string) => {
    onChange(url);
    setUrlInput(url);
    setUrlPreview(url);
  };

  const hasImage = value || urlPreview;

  return (
    <div className="space-y-4">
      {label && <Label className="text-base font-medium">{label}</Label>}
      
      {hasImage && (
        <div className="relative group">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
            <img 
              src={value || urlPreview} 
              alt="Selected image"
              className="w-full h-full object-contain"
              onError={() => setUrlPreview('')}
            />
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onChange('');
                setUrlInput('');
                setUrlPreview('');
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="library" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Library
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            URL
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="library" className="space-y-4 mt-4">
          <div className="text-center p-6 border border-dashed rounded-lg">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Browse and select from your uploaded images
            </p>
            <Button onClick={() => setIsMediaLibraryOpen(true)}>
              Open Library
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4 mt-4">
          <ImageUpload
            value={value}
            onChange={onChange}
            accept="image/*"
            maxSize={5}
          />
        </TabsContent>
        
        <TabsContent value="url" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {urlInput && urlInput !== value && (
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={() => onChange(urlInput)}
                >
                  Use This URL
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <MediaLibrary
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelect={handleLibrarySelect}
        currentUrl={value}
      />
    </div>
  );
};