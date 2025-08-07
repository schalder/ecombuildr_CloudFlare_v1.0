import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PageBuilderElement } from '../types';

interface VideoContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const VideoContentProperties: React.FC<VideoContentPropertiesProps> = ({
  element,
  onUpdate,
}) => {
  const {
    videoType = 'url',
    url = '',
    embedCode = '',
    width = 'full',
    autoplay = false,
    controls = true,
    muted = false
  } = element.content;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="video-type">Video Type</Label>
        <Select value={videoType} onValueChange={(value) => onUpdate('videoType', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="url">Video URL (YouTube, Vimeo, Wistia, MP4)</SelectItem>
            <SelectItem value="embed">Custom Embed Code</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {videoType === 'url' && (
        <div>
          <Label htmlFor="video-url">Video URL</Label>
          <Input
            id="video-url"
            type="url"
            value={url}
            onChange={(e) => onUpdate('url', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/... or https://example.com/video.mp4"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Supports YouTube, Vimeo, Wistia URLs, or direct MP4 links
          </p>
        </div>
      )}

      {videoType === 'embed' && (
        <div>
          <Label htmlFor="embed-code">Custom Embed Code</Label>
          <Textarea
            id="embed-code"
            value={embedCode}
            onChange={(e) => onUpdate('embedCode', e.target.value)}
            placeholder="<iframe src=... or <video>..."
          />
          <p className="text-xs text-muted-foreground mt-1">
            Paste your custom video embed code here
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="video-width">Width</Label>
        <Select value={String(width)} onValueChange={(value) => onUpdate('width', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Width (100%)</SelectItem>
            <SelectItem value="three-quarters">3/4 Width (75%)</SelectItem>
            <SelectItem value="half">Half Width (50%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="autoplay">Autoplay</Label>
          <Switch
            id="autoplay"
            checked={autoplay}
            onCheckedChange={(checked) => onUpdate('autoplay', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="controls">Show Controls</Label>
          <Switch
            id="controls"
            checked={controls}
            onCheckedChange={(checked) => onUpdate('controls', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="muted">Muted</Label>
          <Switch
            id="muted"
            checked={muted}
            onCheckedChange={(checked) => onUpdate('muted', checked)}
          />
        </div>
      </div>
    </div>
  );
};