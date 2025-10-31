import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ImageUpload } from '@/components/ui/image-upload';
import { PageBuilderElement } from '../types';
import { useDevicePreview } from '../contexts/DevicePreviewContext';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet, Plus, Trash2 } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
    ctaButtonSubtext = '',
    ctaButtonUrl = '',
    ctaOpenNewTab = true,
    ctaButtonColor = '#3B82F6',
    ctaHeadlineColor = '#FFFFFF',
    ctaSubheadlineColor = '#E5E7EB',
    ctaBackgroundColor = 'transparent',
    // Scheduled Messages settings
    enableScheduledMessages = false,
    scheduledMessageGroups = [],
  } = element.content as any;

  const { deviceType: responsiveTab, setDeviceType: setResponsiveTab } = useDevicePreview();

  // Store raw textarea values to allow Enter key to work properly
  const [messageTextValues, setMessageTextValues] = React.useState<Record<string, string>>({});

  // Initialize textarea values from messages when groups change
  React.useEffect(() => {
    const newValues: Record<string, string> = {};
    scheduledMessageGroups.forEach((group: any) => {
      if (!messageTextValues[group.id]) {
        newValues[group.id] = (group.messages || []).join('\n');
      }
    });
    if (Object.keys(newValues).length > 0) {
      setMessageTextValues((prev) => ({ ...prev, ...newValues }));
    }
  }, [scheduledMessageGroups.length]); // Only run when number of groups changes

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

  const handleAddScheduledGroup = () => {
    const newGroup = {
      id: `group-${Date.now()}`,
      enabled: true,
      triggerTime: 120, // 2 minutes default
      messages: ['Yes', 'Clear sound', 'Perfect', 'I can hear you', 'Sounds good'],
      useCustomNames: false,
      names: [],
      durationWindowSec: 20,
      count: 5,
    };
    onUpdate('scheduledMessageGroups', [...scheduledMessageGroups, newGroup]);
  };

  const handleUpdateScheduledGroup = (groupId: string, updates: Partial<any>) => {
    const updated = scheduledMessageGroups.map((group: any) =>
      group.id === groupId ? { ...group, ...updates } : group
    );
    onUpdate('scheduledMessageGroups', updated);
  };

  const handleDeleteScheduledGroup = (groupId: string) => {
    const updated = scheduledMessageGroups.filter((group: any) => group.id !== groupId);
    onUpdate('scheduledMessageGroups', updated);
  };

  return (
    <Accordion type="multiple" className="space-y-2">
      {/* Video Settings */}
      <AccordionItem value="video" className="border rounded-lg px-4">
        <AccordionTrigger className="font-semibold">Video Settings</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
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
        </AccordionContent>
      </AccordionItem>

      {/* Countdown Timer */}
      <AccordionItem value="countdown" className="border rounded-lg px-4">
        <AccordionTrigger className="font-semibold">Countdown Timer</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-4">
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
        </AccordionContent>
      </AccordionItem>

      {/* Live Chat & Engagement */}
      <AccordionItem value="chat" className="border rounded-lg px-4">
        <AccordionTrigger className="font-semibold">Live Chat & Engagement</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-4">
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
        </AccordionContent>
      </AccordionItem>

      {/* Scheduled Messages */}
      <AccordionItem value="scheduled-messages" className="border rounded-lg px-4">
        <AccordionTrigger className="font-semibold">Scheduled Messages</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-scheduled-messages">Enable Scheduled Messages</Label>
            <Switch
              id="enable-scheduled-messages"
              checked={enableScheduledMessages}
              onCheckedChange={(checked) => onUpdate('enableScheduledMessages', checked)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Schedule chat messages to appear at specific times (e.g., responses to host questions)
          </p>

          {enableScheduledMessages && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddScheduledGroup}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Scheduled Message Group
              </Button>

              {scheduledMessageGroups.length > 0 && (
                <div className="space-y-4 mt-4">
                  {scheduledMessageGroups.map((group: any, index: number) => (
                    <div key={group.id || index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label className="font-semibold">
                            Group {index + 1} - At {(() => {
                              const totalSeconds = group.triggerTime || 120;
                              const minutes = Math.floor(totalSeconds / 60);
                              const seconds = totalSeconds % 60;
                              if (seconds > 0) {
                                return `${minutes} min ${seconds} sec: ${group.count || 5} messages`;
                              }
                              return `${minutes} min: ${group.count || 5} messages`;
                            })()}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={group.enabled !== false}
                            onCheckedChange={(checked) =>
                              handleUpdateScheduledGroup(group.id, { enabled: checked })
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteScheduledGroup(group.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`trigger-time-${group.id}`}>Trigger After</Label>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label htmlFor={`trigger-minutes-${group.id}`} className="text-xs text-muted-foreground">
                              Minutes
                            </Label>
                            <Input
                              id={`trigger-minutes-${group.id}`}
                              type="number"
                              min={0}
                              max={999}
                              value={Math.floor((group.triggerTime || 120) / 60)}
                              onChange={(e) => {
                                const minutes = Math.max(0, parseInt(e.target.value) || 0);
                                const currentSeconds = (group.triggerTime || 120) % 60;
                                handleUpdateScheduledGroup(group.id, { triggerTime: (minutes * 60) + currentSeconds });
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor={`trigger-seconds-${group.id}`} className="text-xs text-muted-foreground">
                              Seconds
                            </Label>
                            <Input
                              id={`trigger-seconds-${group.id}`}
                              type="number"
                              min={0}
                              max={59}
                              value={(group.triggerTime || 120) % 60}
                              onChange={(e) => {
                                const seconds = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                                const currentMinutes = Math.floor((group.triggerTime || 120) / 60);
                                handleUpdateScheduledGroup(group.id, { triggerTime: (currentMinutes * 60) + seconds });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`messages-${group.id}`}>Response Messages (one per line)</Label>
                        <Textarea
                          id={`messages-${group.id}`}
                          value={messageTextValues[group.id] !== undefined 
                            ? messageTextValues[group.id] 
                            : (group.messages || []).join('\n')}
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            // Update local state immediately to allow Enter key to work
                            setMessageTextValues((prev) => ({
                              ...prev,
                              [group.id]: rawValue,
                            }));
                            // Extract non-empty messages and update the group
                            const messages = rawValue
                              .split('\n')
                              .map((m) => m.trim())
                              .filter((m) => m.length > 0);
                            handleUpdateScheduledGroup(group.id, { messages });
                          }}
                          onBlur={() => {
                            // Sync the stored value when user leaves the field
                            const currentValue = messageTextValues[group.id] || '';
                            const messages = currentValue
                              .split('\n')
                              .map((m) => m.trim())
                              .filter((m) => m.length > 0);
                            // Ensure local state matches the final messages
                            setMessageTextValues((prev) => ({
                              ...prev,
                              [group.id]: messages.join('\n'),
                            }));
                          }}
                          placeholder="Yes&#10;Clear sound&#10;Perfect&#10;I can hear you"
                          rows={5}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter one message per line. These will appear randomly when triggered.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor={`count-${group.id}`}>Number of Messages to Show</Label>
                        <Input
                          id={`count-${group.id}`}
                          type="number"
                          min={1}
                          value={group.count || 5}
                          onChange={(e) => {
                            const count = Math.max(1, parseInt(e.target.value) || 5);
                            handleUpdateScheduledGroup(group.id, { count });
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Messages will be randomly selected from the list above (duplicates allowed)
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor={`use-custom-names-${group.id}`}>Use Custom Names</Label>
                        <Switch
                          id={`use-custom-names-${group.id}`}
                          checked={group.useCustomNames || false}
                          onCheckedChange={(checked) =>
                            handleUpdateScheduledGroup(group.id, { useCustomNames: checked })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground -mt-2">
                        If disabled, uses default fake names pool
                      </p>

                      {group.useCustomNames && (
                        <div>
                          <Label htmlFor={`names-${group.id}`}>Custom Names (one per line, optional)</Label>
                          <Textarea
                            id={`names-${group.id}`}
                            value={(group.names || []).join('\n')}
                            onChange={(e) => {
                              const names = e.target.value
                                .split('\n')
                                .map((n) => n.trim())
                                .filter((n) => n.length > 0);
                              handleUpdateScheduledGroup(group.id, { names });
                            }}
                            placeholder="John Doe&#10;Jane Smith&#10;Mike Johnson"
                            rows={3}
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter one name per line. Leave empty to use default names.
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground pt-2 border-t">
                        {(() => {
                          const totalSeconds = group.triggerTime || 120;
                          const minutes = Math.floor(totalSeconds / 60);
                          const seconds = totalSeconds % 60;
                          const timeDisplay = seconds > 0 
                            ? `${minutes}m ${seconds}s` 
                            : `${minutes} minutes`;
                          return `Messages will start appearing at ${timeDisplay} and will be spread randomly over 15-20 seconds for a realistic feel.`;
                        })()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Live Badge */}
      <AccordionItem value="badge" className="border rounded-lg px-4">
        <AccordionTrigger className="font-semibold">Live Badge</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-4">
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
        </AccordionContent>
      </AccordionItem>

      {/* Audio */}
      <AccordionItem value="audio" className="border rounded-lg px-4">
        <AccordionTrigger className="font-semibold">Audio</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-4">
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
        </AccordionContent>
      </AccordionItem>

      {/* Call to Action */}
      <AccordionItem value="cta" className="border rounded-lg px-4">
        <AccordionTrigger className="font-semibold">Call to Action</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-4">
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
              <Textarea
                id="cta-headline"
                value={ctaHeadline}
                onChange={(e) => onUpdate('ctaHeadline', e.target.value)}
                placeholder="Special Offer Today Only!"
                rows={3}
                className="resize-none"
              />
            </div>

            <div>
              <ColorPicker
                color={ctaHeadlineColor}
                onChange={(color) => onUpdate('ctaHeadlineColor', color)}
                label="Headline Color"
              />
            </div>

            <div>
              <Label htmlFor="cta-subheadline">Subheadline (Optional)</Label>
              <Textarea
                id="cta-subheadline"
                value={ctaSubheadline}
                onChange={(e) => onUpdate('ctaSubheadline', e.target.value)}
                placeholder="Don't miss this exclusive deal"
                rows={3}
                className="resize-none"
              />
            </div>

            <div>
              <ColorPicker
                color={ctaSubheadlineColor}
                onChange={(color) => onUpdate('ctaSubheadlineColor', color)}
                label="Subheadline Color"
              />
            </div>

            <div>
              <ColorPicker
                color={ctaBackgroundColor}
                onChange={(color) => onUpdate('ctaBackgroundColor', color)}
                label="Background Color"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Background color for the CTA section
              </p>
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
              <Label htmlFor="cta-button-subtext">Button Sub Text (Optional)</Label>
              <Input
                id="cta-button-subtext"
                value={ctaButtonSubtext}
                onChange={(e) => onUpdate('ctaButtonSubtext', e.target.value)}
                placeholder="Limited time offer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Small text that appears below the button
              </p>
            </div>

            <div>
              <ColorPicker
                color={ctaButtonColor}
                onChange={(color) => onUpdate('ctaButtonColor', color)}
                label="Button Color"
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
        </AccordionContent>
      </AccordionItem>

      {/* Layout & Width */}
      <AccordionItem value="layout" className="border rounded-lg px-4">
        <AccordionTrigger className="font-semibold">Layout & Width</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-4">
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

