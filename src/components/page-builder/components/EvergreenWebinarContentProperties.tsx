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
import { ColorPicker } from '@/components/ui/color-picker';

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
    // CTA settings
    enableCTA = false,
    ctaDisplayTime = 60,
    ctaHeadline = '',
    ctaSubheadline = '',
    ctaButtonText = 'Click Here',
    ctaButtonUrl = '',
    ctaOpenNewTab = true,
    ctaButtonColor = '#3B82F6',
    ctaHeadlineColor = '#FFFFFF',
    ctaSubheadlineColor = '#E5E7EB',
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
            <Label htmlFor="countdown-seconds">Countdown Duration (seconds)</Label>
            <div className="flex gap-2 mt-2">
              <Slider
                min={0}
                max={300}
                step={1}
                value={[countdownSeconds]}
                onValueChange={([value]) => onUpdate('countdownSeconds', value)}
                className="flex-1"
              />
              <Input
                id="countdown-seconds"
                type="number"
                min={0}
                max={1800}
                value={countdownSeconds}
                onChange={(e) => onUpdate('countdownSeconds', parseInt(e.target.value) || 0)}
                className="w-24"
                placeholder="Seconds"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0s (instant)</span>
              <span>5min (300s)</span>
            </div>
            {countdownSeconds > 60 && (
              <p className="text-xs text-green-600 mt-1">
                {Math.floor(countdownSeconds / 60)}m {countdownSeconds % 60}s countdown
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Enter any value from 0 (instant) to 1800 (30 minutes). Supports mm:ss format for long countdowns.
            </p>
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

            <div className="flex items-center justify-between">
              <Label htmlFor="allow-user-messages">Allow Users to Send Messages</Label>
              <Switch
                id="allow-user-messages"
                checked={element.content.allowUserMessages !== false}
                onCheckedChange={(checked) => onUpdate('allowUserMessages', checked)}
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

      {/* CTA Settings */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-cta">Enable Call-to-Action</Label>
          <Switch
            id="enable-cta"
            checked={enableCTA}
            onCheckedChange={(checked) => onUpdate('enableCTA', checked)}
          />
        </div>

        {enableCTA && (
          <>
            <div>
              <Label htmlFor="cta-display-time">Display CTA After (seconds)</Label>
              <Input
                id="cta-display-time"
                type="number"
                value={ctaDisplayTime}
                onChange={(e) => onUpdate('ctaDisplayTime', parseInt(e.target.value) || 0)}
                min={1}
                max={3600}
              />
              <p className="text-xs text-muted-foreground mt-1">
                When to show the CTA during the webinar (e.g., 60 = after 1 minute)
              </p>
            </div>

            <div>
              <Label htmlFor="cta-headline">Headline (Optional)</Label>
              <Input
                id="cta-headline"
                value={ctaHeadline}
                onChange={(e) => onUpdate('ctaHeadline', e.target.value)}
                placeholder="Special Offer Today Only!"
              />
            </div>

            <div>
              <Label htmlFor="cta-headline-color">Headline Color</Label>
              <ColorPicker
                value={ctaHeadlineColor}
                onChange={(color) => onUpdate('ctaHeadlineColor', color)}
              />
            </div>

            <div>
              <Label htmlFor="cta-subheadline">Subheadline (Optional)</Label>
              <Input
                id="cta-subheadline"
                value={ctaSubheadline}
                onChange={(e) => onUpdate('ctaSubheadline', e.target.value)}
                placeholder="Don't miss this exclusive deal"
              />
            </div>

            <div>
              <Label htmlFor="cta-subheadline-color">Subheadline Color</Label>
              <ColorPicker
                value={ctaSubheadlineColor}
                onChange={(color) => onUpdate('ctaSubheadlineColor', color)}
              />
            </div>

            <div>
              <Label htmlFor="cta-button-text">Button Text</Label>
              <Input
                id="cta-button-text"
                value={ctaButtonText}
                onChange={(e) => onUpdate('ctaButtonText', e.target.value)}
                placeholder="Click Here"
              />
            </div>

            <div>
              <Label htmlFor="cta-button-url">Button URL</Label>
              <Input
                id="cta-button-url"
                type="url"
                value={ctaButtonUrl}
                onChange={(e) => onUpdate('ctaButtonUrl', e.target.value)}
                placeholder="https://example.com/offer"
              />
            </div>

            <div>
              <Label htmlFor="cta-button-color">Button Color</Label>
              <ColorPicker
                value={ctaButtonColor}
                onChange={(color) => onUpdate('ctaButtonColor', color)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cta-open-new-tab">Open in New Tab</Label>
              <Switch
                id="cta-open-new-tab"
                checked={ctaOpenNewTab}
                onCheckedChange={(checked) => onUpdate('ctaOpenNewTab', checked)}
              />
            </div>
          </>
        )}
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

