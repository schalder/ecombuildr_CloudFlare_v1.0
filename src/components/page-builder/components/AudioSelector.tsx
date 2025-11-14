import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FolderOpen, Link, Music, X } from 'lucide-react';
import { AudioUpload } from '@/components/ui/audio-upload';
import { MediaLibrary } from './MediaLibrary';

interface AudioSelectorProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  maxSize?: number; // in MB
}

export const AudioSelector: React.FC<AudioSelectorProps> = ({
  value = '',
  onChange,
  label = 'Select Audio',
  maxSize = 50
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

  const hasAudio = value || urlPreview;

  return (
    <div className="space-y-4">
      {label && <Label className="text-base font-medium">{label}</Label>}
      
      {hasAudio && (
        <div className="relative group">
          <div className="bg-muted rounded-lg overflow-hidden border p-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Audio file selected</p>
                <p className="text-xs text-muted-foreground truncate" title={value || urlPreview}>
                  {value || urlPreview}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="flex-shrink-0"
                onClick={() => {
                  onChange('');
                  setUrlInput('');
                  setUrlPreview('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
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
              Browse and select from your uploaded audio files
            </p>
            <Button type="button" onClick={() => setIsMediaLibraryOpen(true)}>
              Open Library
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4 mt-4">
          <AudioUpload
            value={value}
            onChange={onChange}
            accept="audio/*"
            maxSize={maxSize}
          />
        </TabsContent>
        
        <TabsContent value="url" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="audio-url">Audio URL</Label>
            <Input
              id="audio-url"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/audio.mp3"
            />
            {urlInput && urlInput !== value && (
              <div className="mt-2">
                <Button
                  type="button"
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
        mediaType="audio"
      />
    </div>
  );
};

