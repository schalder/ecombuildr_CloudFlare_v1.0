import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PageBuilderElement } from '../types';
import { useDevicePreview } from '../contexts/DevicePreviewContext';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

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

  const { deviceType: responsiveTab, setDeviceType: setResponsiveTab } = useDevicePreview();
  
  // Initialize widthByDevice with proper defaults for each device
  const widthByDevice = React.useMemo(() => {
    const existingWidthByDevice = (element.content as any).widthByDevice;
    return {
      desktop: existingWidthByDevice?.desktop || width || 'full',
      tablet: existingWidthByDevice?.tablet || 'full',
      mobile: existingWidthByDevice?.mobile || 'full'
    };
  }, [(element.content as any).widthByDevice, width]);

  const handleWidthByDeviceChange = (device: 'desktop' | 'tablet' | 'mobile', value: string) => {
    const updated = { ...widthByDevice, [device]: value };
    onUpdate('widthByDevice', updated);
    
    // Always update the legacy width property to match desktop for backward compatibility
    onUpdate('width', updated.desktop);
  };

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
            Supports YouTube (including Shorts), Vimeo, Wistia URLs, or direct MP4 links
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
        <div className="flex items-center justify-between">
          <Label htmlFor="video-width">Width</Label>
          <div className="flex space-x-1">
            <Button size="sm" variant={responsiveTab === 'desktop' ? 'default' : 'outline'} onClick={() => setResponsiveTab('desktop')}>
              <Monitor className="h-4 w-4" />
            </Button>
            <Button size="sm" variant={responsiveTab === 'tablet' ? 'default' : 'outline'} onClick={() => setResponsiveTab('tablet')}>
              <Tablet className="h-4 w-4" />
            </Button>
            <Button size="sm" variant={responsiveTab === 'mobile' ? 'default' : 'outline'} onClick={() => setResponsiveTab('mobile')}>
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Select value={String(widthByDevice[responsiveTab] || 'full')} onValueChange={(value) => handleWidthByDeviceChange(responsiveTab, value)}>
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