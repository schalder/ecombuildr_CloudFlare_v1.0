import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MediaSelector } from './MediaSelector';
import { CompactMediaSelector } from './CompactMediaSelector';
import { AudioSelector } from './AudioSelector';
import { Plus, Trash2, GripVertical, Monitor, Tablet, Smartphone } from 'lucide-react';
import { PageBuilderElement, ElementVisibility } from '../types';
import { useDevicePreview } from '../contexts/DevicePreviewContext';
import { VisibilityControl } from './VisibilityControl';

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
      <VisibilityControl
        visibility={currentVisibility}
        onVisibilityChange={handleVisibilityChange}
      />
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
            <div key={index} className="flex items-center space-x-2 p-2 border rounded overflow-hidden">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <CompactMediaSelector
                  value={image}
                  onChange={(url) => updateImage(index, url)}
                  label={`Image ${index + 1}`}
                />
              </div>
              <Button
                onClick={() => removeImage(index)}
                size="sm"
                variant="destructive"
                className="flex-shrink-0"
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
  const { deviceType: responsiveTab, setDeviceType: setResponsiveTab } = useDevicePreview();
  
  const images = element.content.images || [];
  const autoPlay = element.content.autoPlay || false;
  const autoPlayDelay = element.content.autoPlayDelay || 3000;
  const showArrows = element.content.showArrows !== false;
  const showDots = element.content.showDots !== false;
  const pauseOnHover = element.content.pauseOnHover !== false;
  const height = element.content.height || 384;
  const imageFit = element.content.imageFit || 'cover';
  
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

  // Get current visibleImagesByDevice with proper defaults
  const currentVisibleImagesByDevice = React.useMemo(() => {
    const existing = (element.content as any).visibleImagesByDevice || {};
    return {
      desktop: existing.desktop || 1,
      tablet: existing.tablet || 1,
      mobile: existing.mobile || 1
    };
  }, [(element.content as any).visibleImagesByDevice]);

  const handleVisibleImagesByDeviceChange = (device: 'desktop' | 'tablet' | 'mobile', value: number) => {
    const updated = { ...currentVisibleImagesByDevice, [device]: value };
    onUpdate('visibleImagesByDevice', updated);
  };

  // Get the current visible images for the selected device
  const currentDeviceVisibleImages = currentVisibleImagesByDevice[responsiveTab] || 1;

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
      <VisibilityControl
        visibility={currentVisibility}
        onVisibilityChange={handleVisibilityChange}
      />
      <div>
        <Label htmlFor="carousel-height">Carousel Height (px)</Label>
        <Input
          id="carousel-height"
          type="number"
          value={height}
          onChange={(e) => onUpdate('height', parseInt(e.target.value) || 384)}
          min="200"
          max="800"
          step="20"
        />
      </div>

      <div>
        <Label htmlFor="image-fit">Image Fit</Label>
        <Select value={imageFit} onValueChange={(value) => onUpdate('imageFit', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">Cover (crop to fill)</SelectItem>
            <SelectItem value="contain">Contain (fit full image)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Visible Images Control */}
      <div>
        <Label>Visible Images</Label>
        <div className="space-y-3">
          {/* Device Selector */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={responsiveTab === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setResponsiveTab('desktop')}
              className="h-8 px-2"
            >
              <Monitor className="h-3 w-3" />
            </Button>
            <Button
              variant={responsiveTab === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setResponsiveTab('tablet')}
              className="h-8 px-2"
            >
              <Tablet className="h-3 w-3" />
            </Button>
            <Button
              variant={responsiveTab === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setResponsiveTab('mobile')}
              className="h-8 px-2"
            >
              <Smartphone className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Visible Images Selector */}
          <Select 
            value={currentDeviceVisibleImages.toString()} 
            onValueChange={(value) => handleVisibleImagesByDeviceChange(responsiveTab, parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select visible images" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Image</SelectItem>
              <SelectItem value="2">2 Images</SelectItem>
              <SelectItem value="3">3 Images</SelectItem>
              <SelectItem value="4">4 Images</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
            <div key={index} className="flex items-center space-x-2 p-2 border rounded overflow-hidden">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <CompactMediaSelector
                  value={image}
                  onChange={(url) => updateImage(index, url)}
                  label={`Image ${index + 1}`}
                />
              </div>
              <Button
                onClick={() => removeImage(index)}
                size="sm"
                variant="destructive"
                className="flex-shrink-0"
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
      <VisibilityControl
        visibility={currentVisibility}
        onVisibilityChange={handleVisibilityChange}
      />
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
                  placeholder="YouTube, Vimeo, Wistia, or MP4 URL"
                />
              </div>

              <div>
                <Label>Thumbnail</Label>
                <MediaSelector
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

// Audio Player Properties
export const AudioPlayerProperties: React.FC<MediaPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const audioUrl = element.content.audioUrl || '';
  const autoplay = element.content.autoplay || false;
  const loop = element.content.loop || false;
  const showVolume = element.content.showVolume !== false; // Default to true
  
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
        <AudioSelector
          value={audioUrl}
          onChange={(url) => onUpdate('audioUrl', url)}
          label="Audio File"
          maxSize={50}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="audio-autoplay">Autoplay</Label>
            <p className="text-xs text-muted-foreground">Start playing automatically when page loads</p>
          </div>
          <Switch
            id="audio-autoplay"
            checked={autoplay}
            onCheckedChange={(checked) => onUpdate('autoplay', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="audio-loop">Loop</Label>
            <p className="text-xs text-muted-foreground">Automatically restart when finished</p>
          </div>
          <Switch
            id="audio-loop"
            checked={loop}
            onCheckedChange={(checked) => onUpdate('loop', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="audio-volume">Show Volume Control</Label>
            <p className="text-xs text-muted-foreground">Display volume slider in player</p>
          </div>
          <Switch
            id="audio-volume"
            checked={showVolume}
            onCheckedChange={(checked) => onUpdate('showVolume', checked)}
          />
        </div>
      </div>
    </div>
  );
};