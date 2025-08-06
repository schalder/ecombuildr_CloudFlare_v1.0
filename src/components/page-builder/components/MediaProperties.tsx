import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { PageBuilderElement } from '../types';

interface MediaPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

// Image Gallery Properties
export const ImageGalleryProperties: React.FC<MediaPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const images = element.content.images || [];
  const columns = element.content.columns || 3;
  const gap = element.content.gap || 'md';
  const aspectRatio = element.content.aspectRatio || 'square';
  const showLightbox = element.content.showLightbox !== false;

  const addImage = () => {
    const newImages = [...images, ''];
    onUpdate('images', newImages);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_: any, i: number) => i !== index);
    onUpdate('images', newImages);
  };

  const updateImage = (index: number, url: string) => {
    const newImages = [...images];
    newImages[index] = url;
    onUpdate('images', newImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="gallery-title">Gallery Title</Label>
        <Input
          id="gallery-title"
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Image Gallery"
        />
      </div>

      <div>
        <Label htmlFor="columns">Columns</Label>
        <Select value={columns.toString()} onValueChange={(value) => onUpdate('columns', parseInt(value))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
            <SelectItem value="5">5 Columns</SelectItem>
            <SelectItem value="6">6 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="gap">Gap Size</Label>
        <Select value={gap} onValueChange={(value) => onUpdate('gap', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="xl">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
        <Select value={aspectRatio} onValueChange={(value) => onUpdate('aspectRatio', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="square">Square (1:1)</SelectItem>
            <SelectItem value="landscape">Landscape (16:9)</SelectItem>
            <SelectItem value="portrait">Portrait (3:4)</SelectItem>
            <SelectItem value="auto">Auto Height</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="lightbox"
          checked={showLightbox}
          onCheckedChange={(checked) => onUpdate('showLightbox', checked)}
        />
        <Label htmlFor="lightbox">Enable Lightbox</Label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Images ({images.length})</Label>
          <Button onClick={addImage} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Image
          </Button>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {images.map((image: string, index: number) => (
            <div key={index} className="flex items-center space-x-2 p-2 border rounded">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <ImageUpload
                  value={image}
                  onChange={(url) => updateImage(index, url)}
                  label={`Image ${index + 1}`}
                />
              </div>
              <Button
                onClick={() => removeImage(index)}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Image Carousel Properties
export const ImageCarouselProperties: React.FC<MediaPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const images = element.content.images || [];
  const autoPlay = element.content.autoPlay || false;
  const autoPlayDelay = element.content.autoPlayDelay || 3000;
  const showArrows = element.content.showArrows !== false;
  const showDots = element.content.showDots !== false;
  const pauseOnHover = element.content.pauseOnHover !== false;

  const addImage = () => {
    const newImages = [...images, ''];
    onUpdate('images', newImages);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_: any, i: number) => i !== index);
    onUpdate('images', newImages);
  };

  const updateImage = (index: number, url: string) => {
    const newImages = [...images];
    newImages[index] = url;
    onUpdate('images', newImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="carousel-title">Carousel Title</Label>
        <Input
          id="carousel-title"
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Image Carousel"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="auto-play"
          checked={autoPlay}
          onCheckedChange={(checked) => onUpdate('autoPlay', checked)}
        />
        <Label htmlFor="auto-play">Auto Play</Label>
      </div>

      {autoPlay && (
        <div>
          <Label htmlFor="auto-play-delay">Auto Play Delay (ms)</Label>
          <Input
            id="auto-play-delay"
            type="number"
            value={autoPlayDelay}
            onChange={(e) => onUpdate('autoPlayDelay', parseInt(e.target.value))}
            min="1000"
            max="10000"
            step="500"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="pause-hover"
          checked={pauseOnHover}
          onCheckedChange={(checked) => onUpdate('pauseOnHover', checked)}
        />
        <Label htmlFor="pause-hover">Pause on Hover</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="show-arrows"
          checked={showArrows}
          onCheckedChange={(checked) => onUpdate('showArrows', checked)}
        />
        <Label htmlFor="show-arrows">Show Navigation Arrows</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="show-dots"
          checked={showDots}
          onCheckedChange={(checked) => onUpdate('showDots', checked)}
        />
        <Label htmlFor="show-dots">Show Dots Indicator</Label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Images ({images.length})</Label>
          <Button onClick={addImage} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Image
          </Button>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {images.map((image: string, index: number) => (
            <div key={index} className="flex items-center space-x-2 p-2 border rounded">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <ImageUpload
                  value={image}
                  onChange={(url) => updateImage(index, url)}
                  label={`Image ${index + 1}`}
                />
              </div>
              <Button
                onClick={() => removeImage(index)}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Video Playlist Properties
export const VideoPlaylistProperties: React.FC<MediaPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const videos = element.content.videos || [];
  const autoPlay = element.content.autoPlay || false;
  const showControls = element.content.showControls !== false;
  const muted = element.content.muted || false;

  const addVideo = () => {
    const newVideos = [...videos, { title: '', url: '', thumbnail: '' }];
    onUpdate('videos', newVideos);
  };

  const removeVideo = (index: number) => {
    const newVideos = videos.filter((_: any, i: number) => i !== index);
    onUpdate('videos', newVideos);
  };

  const updateVideo = (index: number, field: string, value: string) => {
    const newVideos = [...videos];
    newVideos[index] = { ...newVideos[index], [field]: value };
    onUpdate('videos', newVideos);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="playlist-title">Playlist Title</Label>
        <Input
          id="playlist-title"
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Video Playlist"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="video-autoplay"
          checked={autoPlay}
          onCheckedChange={(checked) => onUpdate('autoPlay', checked)}
        />
        <Label htmlFor="video-autoplay">Auto Play</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="video-controls"
          checked={showControls}
          onCheckedChange={(checked) => onUpdate('showControls', checked)}
        />
        <Label htmlFor="video-controls">Show Controls</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="video-muted"
          checked={muted}
          onCheckedChange={(checked) => onUpdate('muted', checked)}
        />
        <Label htmlFor="video-muted">Start Muted</Label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Videos ({videos.length})</Label>
          <Button onClick={addVideo} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Video
          </Button>
        </div>
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {videos.map((video: any, index: number) => (
            <div key={index} className="p-3 border rounded space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Video {index + 1}</span>
                <Button
                  onClick={() => removeVideo(index)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <Label>Title</Label>
                <Input
                  value={video.title || ''}
                  onChange={(e) => updateVideo(index, 'title', e.target.value)}
                  placeholder="Video title"
                />
              </div>

              <div>
                <Label>Video URL</Label>
                <Input
                  value={video.url || ''}
                  onChange={(e) => updateVideo(index, 'url', e.target.value)}
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              <div>
                <Label>Thumbnail</Label>
                <ImageUpload
                  value={video.thumbnail || ''}
                  onChange={(url) => updateVideo(index, 'thumbnail', url)}
                  label="Video thumbnail"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};