import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ImageUpload } from '@/components/ui/image-upload';
import { PageBuilderElement } from '../types';
import { useDevicePreview } from '../contexts/DevicePreviewContext';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface EvergreenWebinarContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const EvergreenWebinarContentProperties: React.FC<EvergreenWebinarContentPropertiesProps> = ({
  element,
  onUpdate,
}) => {
  const {
    videoUrl = '',
    thumbnail = '',
    enableCountdown = false,
    countdownSeconds = 5,
    enableChat = true,
    viewerCount = 237,
    showChatMessages = true,
    showLiveBadge = true,
    liveBadgePosition = 'top-right',
    liveBadgeStyle = 'pulse-text',
    widthByDevice,
    muted = true,
  } = element.content as any;

  const { deviceType: responsiveTab, setDeviceType: setResponsiveTab } = useDevicePreview();

  const currentWidthByDevice = {
    desktop: widthByDevice?.desktop || 'full',
    tablet: widthByDevice?.tablet || 'full',
    mobile: widthByDevice?.mobile || 'full',
  };

  const handleWidthByDeviceChange = (device: 'desktop' | 'tablet' | 'mobile', value: string) => {
    const updated = { ...currentWidthByDevice, [device]: value };
    onUpdate('widthByDevice', updated);
  };

  const currentDeviceWidth = currentWidthByDevice[responsiveTab] || 'full';

  return (
    <div className="space-y-4">
      {/* Video URL */}
      <div>
        <Label htmlFor="video-url">YouTube Video URL *</Label>
        <Input
          id="video-url"
          type="url"
          value={videoUrl}
          onChange={(e) => onUpdate('videoUrl', e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter the YouTube video URL for your webinar
        </p>
      </div>

      {/* Thumbnail Upload */}
      <div>
        <Label htmlFor="thumbnail">Custom Thumbnail (Optional)</Label>
        <ImageUpload
          value={thumbnail}
          onChange={(url) => onUpdate('thumbnail', url)}
          accept="image/*"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Upload a custom thumbnail or leave empty to use YouTube thumbnail
        </p>
      </div>

      {/* Countdown Settings */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-countdown">Enable Countdown Timer</Label>
          <Switch
            id="enable-countdown"
            checked={enableCountdown}
            onCheckedChange={(checked) => onUpdate('enableCountdown', checked)}
          />
        </div>

        {enableCountdown && (
          <div>
            <Label htmlFor="countdown-seconds">Countdown Duration: {countdownSeconds} seconds</Label>
            <Slider
              id="countdown-seconds"
              min={3}
              max={10}
              step={1}
              value={[countdownSeconds]}
              onValueChange={([value]) => onUpdate('countdownSeconds', value)}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>3s</span>
              <span>10s</span>
            </div>
          </div>
        )}
      </div>

      {/* Live Chat Settings */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-chat">Enable Live Chat</Label>
          <Switch
            id="enable-chat"
            checked={enableChat}
            onCheckedChange={(checked) => onUpdate('enableChat', checked)}
          />
        </div>

        {enableChat && (
          <>
            <div>
              <Label htmlFor="viewer-count">Fake Viewer Count</Label>
              <Input
                id="viewer-count"
                type="number"
                value={viewerCount}
                onChange={(e) => onUpdate('viewerCount', parseInt(e.target.value) || 0)}
                min={1}
                max={9999}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of fake viewers to display
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-chat-messages">Show Chat Messages</Label>
              <Switch
                id="show-chat-messages"
                checked={showChatMessages}
                onCheckedChange={(checked) => onUpdate('showChatMessages', checked)}
              />
            </div>
          </>
        )}
      </div>

      {/* Live Badge Settings */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-live-badge">Show LIVE Badge</Label>
          <Switch
            id="show-live-badge"
            checked={showLiveBadge}
            onCheckedChange={(checked) => onUpdate('showLiveBadge', checked)}
          />
        </div>

        {showLiveBadge && (
          <>
            <div>
              <Label htmlFor="live-badge-position">Badge Position</Label>
              <Select value={liveBadgePosition} onValueChange={(value) => onUpdate('liveBadgePosition', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="live-badge-style">Badge Style</Label>
              <Select value={liveBadgeStyle} onValueChange={(value) => onUpdate('liveBadgeStyle', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pulse-text">Pulse Text (LIVE with pulse)</SelectItem>
                  <SelectItem value="red-dot">Red Dot</SelectItem>
                  <SelectItem value="pulse-bg">Pulsing Background</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {/* Audio Settings */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="muted">Start Muted</Label>
          <Switch
            id="muted"
            checked={muted}
            onCheckedChange={(checked) => onUpdate('muted', checked)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Video will autoplay muted (recommended for better autoplay support)
        </p>
      </div>

      {/* Width Settings */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="webinar-width">Video Width</Label>
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
        <Select value={currentDeviceWidth} onValueChange={(value) => handleWidthByDeviceChange(responsiveTab, value)}>
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
    </div>
  );
};

