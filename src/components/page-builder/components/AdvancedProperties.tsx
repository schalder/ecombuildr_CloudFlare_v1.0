import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PageBuilderElement, ElementVisibility } from '../types';
import { VisibilityControl } from './VisibilityControl';

interface AdvancedPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

// Google Maps Properties
export const GoogleMapsProperties: React.FC<AdvancedPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const apiKey = element.content.apiKey || '';
  const location = element.content.location || 'New York, NY';
  const zoom = element.content.zoom || 15;
  const mapType = element.content.mapType || 'roadmap';
  const height = element.content.height || 400;
  const showMarker = element.content.showMarker !== false;
  const markerTitle = element.content.markerTitle || '';
  
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
        <Label htmlFor="maps-title">Map Title</Label>
        <Input
          id="maps-title"
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Location"
        />
      </div>

      <div>
        <Label htmlFor="maps-api-key">Google Maps API Key</Label>
        <Input
          id="maps-api-key"
          value={apiKey}
          onChange={(e) => onUpdate('apiKey', e.target.value)}
          placeholder="Enter your Google Maps API key"
          type="password"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Get your API key from Google Cloud Console
        </p>
      </div>

      <div>
        <Label htmlFor="maps-location">Location</Label>
        <Input
          id="maps-location"
          value={location}
          onChange={(e) => onUpdate('location', e.target.value)}
          placeholder="e.g., New York, NY or latitude,longitude"
        />
      </div>

      <div>
        <Label htmlFor="maps-zoom">Zoom Level</Label>
        <Select value={zoom.toString()} onValueChange={(value) => onUpdate('zoom', parseInt(value))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 - City</SelectItem>
            <SelectItem value="12">12 - District</SelectItem>
            <SelectItem value="15">15 - Streets</SelectItem>
            <SelectItem value="18">18 - Buildings</SelectItem>
            <SelectItem value="20">20 - Close</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="maps-type">Map Type</Label>
        <Select value={mapType} onValueChange={(value) => onUpdate('mapType', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roadmap">Roadmap</SelectItem>
            <SelectItem value="satellite">Satellite</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="terrain">Terrain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="maps-height">Height (px)</Label>
        <Input
          id="maps-height"
          type="number"
          value={height}
          onChange={(e) => onUpdate('height', parseInt(e.target.value))}
          min="200"
          max="800"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="show-marker"
          checked={showMarker}
          onCheckedChange={(checked) => onUpdate('showMarker', checked)}
        />
        <Label htmlFor="show-marker">Show Marker</Label>
      </div>

      {showMarker && (
        <div>
          <Label htmlFor="marker-title">Marker Title</Label>
          <Input
            id="marker-title"
            value={markerTitle}
            onChange={(e) => onUpdate('markerTitle', e.target.value)}
            placeholder="Location marker title"
          />
        </div>
      )}
    </div>
  );
};

// Custom HTML Properties
export const CustomHTMLProperties: React.FC<AdvancedPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const html = element.content.html || '';
  const enableSyntaxHighlighting = element.content.enableSyntaxHighlighting !== false;
  const allowDangerousHTML = element.content.allowDangerousHTML || false;
  
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
        <Label htmlFor="html-title">HTML Block Title</Label>
        <Input
          id="html-title"
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Custom HTML"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="syntax-highlighting"
          checked={enableSyntaxHighlighting}
          onCheckedChange={(checked) => onUpdate('enableSyntaxHighlighting', checked)}
        />
        <Label htmlFor="syntax-highlighting">Syntax Highlighting</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="allow-dangerous"
          checked={allowDangerousHTML}
          onCheckedChange={(checked) => onUpdate('allowDangerousHTML', checked)}
        />
        <Label htmlFor="allow-dangerous">Allow Scripts & External Content</Label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>HTML Code</Label>
          <Button
            onClick={() => setShowPreview(!showPreview)}
            size="sm"
            variant="outline"
          >
            {showPreview ? 'Show Code' : 'Show Preview'}
          </Button>
        </div>
        
        {showPreview ? (
          <div 
            className="p-4 border rounded-lg bg-background min-h-[200px]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <Textarea
            value={html}
            onChange={(e) => onUpdate('html', e.target.value)}
            placeholder="Enter your HTML code here..."
            rows={12}
            className="font-mono text-sm"
          />
        )}
      </div>

      <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
        <p className="font-medium mb-1">Security Notice:</p>
        <p>Be cautious when enabling dangerous HTML. Only use trusted code to prevent XSS attacks.</p>
      </div>

      <div>
        <Label>Common HTML Snippets</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button
            onClick={() => onUpdate('html', '<div class="text-center"><h2>Heading</h2><p>Content goes here</p></div>')}
            size="sm"
            variant="outline"
          >
            Basic Content
          </Button>
          <Button
            onClick={() => onUpdate('html', '<div class="grid grid-cols-2 gap-4"><div>Column 1</div><div>Column 2</div></div>')}
            size="sm"
            variant="outline"
          >
            Two Columns
          </Button>
          <Button
            onClick={() => onUpdate('html', '<iframe width="100%" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>')}
            size="sm"
            variant="outline"
          >
            YouTube Embed
          </Button>
          <Button
            onClick={() => onUpdate('html', '<blockquote class="border-l-4 border-primary pl-4 italic">"Quote text here"</blockquote>')}
            size="sm"
            variant="outline"
          >
            Quote Block
          </Button>
        </div>
      </div>
    </div>
  );
};

// Social Links Properties
export const SocialLinksProperties: React.FC<AdvancedPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const [sectionsOpen, setSectionsOpen] = useState({
    platforms: true,
    links: true,
    display: true,
  });

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
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

  const platforms = element.content.platforms || {
    facebook: true,
    twitter: true,
    instagram: true,
    linkedin: true,
    youtube: false,
    github: false,
  };

  const links = element.content.links || {
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    github: '',
  };

  const handlePlatformToggle = (platform: string, enabled: boolean) => {
    onUpdate('platforms', { ...platforms, [platform]: enabled });
  };

  const handleLinkUpdate = (platform: string, url: string) => {
    onUpdate('links', { ...links, [platform]: url });
  };

  const platformLabels: Record<string, string> = {
    facebook: 'Facebook',
    twitter: 'Twitter',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    github: 'GitHub',
  };

  return (
    <div className="space-y-4">
      <VisibilityControl
        visibility={currentVisibility}
        onVisibilityChange={handleVisibilityChange}
      />
      <div>
        <Label htmlFor="title">Title (Optional)</Label>
        <Input
          id="title"
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Follow us on social media"
        />
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="font-medium">Platform Selection</Label>
        </div>
        {Object.entries(platformLabels).map(([platform, label]) => (
          <div key={platform} className="flex items-center justify-between mb-2">
            <Label htmlFor={`platform-${platform}`}>{label}</Label>
            <Switch
              id={`platform-${platform}`}
              checked={platforms[platform as keyof typeof platforms] || false}
              onCheckedChange={(checked) => handlePlatformToggle(platform, checked)}
            />
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <Label className="font-medium mb-3 block">Social Links</Label>
        {Object.entries(platformLabels).map(([platform, label]) => {
          const isEnabled = platforms[platform as keyof typeof platforms];
          if (!isEnabled) return null;

          return (
            <div key={platform} className="mb-3">
              <Label htmlFor={`link-${platform}`}>{label} URL</Label>
              <Input
                id={`link-${platform}`}
                value={links[platform as keyof typeof links] || ''}
                onChange={(e) => handleLinkUpdate(platform, e.target.value)}
                placeholder={`https://${platform}.com/yourprofile`}
              />
            </div>
          );
        })}
        {Object.values(platforms).every(enabled => !enabled) && (
          <p className="text-sm text-muted-foreground">
            Enable platforms above to add links
          </p>
        )}
      </div>

      <div className="border-t pt-4">
        <Label className="font-medium mb-3 block">Display Options</Label>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="layout">Layout</Label>
            <Select
              value={element.content.layout || 'horizontal'}
              onValueChange={(value) => onUpdate('layout', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="buttonVariant">Button Style</Label>
            <Select
              value={element.content.buttonVariant || 'outline'}
              onValueChange={(value) => onUpdate('buttonVariant', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select button style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="buttonSize">Button Size</Label>
            <Select
              value={element.content.buttonSize || 'default'}
              onValueChange={(value) => onUpdate('buttonSize', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select button size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showIcons">Show Icons</Label>
            <Switch
              id="showIcons"
              checked={element.content.showIcons !== false}
              onCheckedChange={(checked) => onUpdate('showIcons', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showLabels">Show Labels</Label>
            <Switch
              id="showLabels"
              checked={element.content.showLabels || false}
              onCheckedChange={(checked) => onUpdate('showLabels', checked)}
            />
          </div>

          {element.content.showIcons !== false && element.content.showLabels && (
            <div>
              <Label htmlFor="iconSpacing">Icon Spacing</Label>
              <Select
                value={element.content.iconSpacing || 'normal'}
                onValueChange={(value) => onUpdate('iconSpacing', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select spacing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight">Tight</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Social Share Properties
export const SocialShareProperties: React.FC<AdvancedPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const platforms = element.content.platforms || {
    facebook: true,
    twitter: true,
    linkedin: true,
    copy: true,
    whatsapp: false,
    telegram: false,
    reddit: false,
    email: false
  };

  const layout = element.content.layout || 'horizontal';
  const buttonStyle = element.content.buttonStyle || 'default';
  const showLabels = element.content.showLabels !== false;
  const shareUrl = element.content.url || '';
  const shareText = element.content.text || '';
  
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

  const updatePlatform = (platform: string, enabled: boolean) => {
    const newPlatforms = { ...platforms, [platform]: enabled };
    onUpdate('platforms', newPlatforms);
  };

  return (
    <div className="space-y-4">
      <VisibilityControl
        visibility={currentVisibility}
        onVisibilityChange={handleVisibilityChange}
      />
      <div>
        <Label htmlFor="social-title">Share Title</Label>
        <Input
          id="social-title"
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Share this page"
        />
      </div>

      <div>
        <Label htmlFor="share-url">Share URL</Label>
        <Input
          id="share-url"
          value={shareUrl}
          onChange={(e) => onUpdate('url', e.target.value)}
          placeholder="Leave empty to use current page URL"
        />
      </div>

      <div>
        <Label htmlFor="share-text">Share Text</Label>
        <Textarea
          id="share-text"
          value={shareText}
          onChange={(e) => onUpdate('text', e.target.value)}
          placeholder="Check out this amazing content!"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="layout">Layout</Label>
        <Select value={layout} onValueChange={(value) => onUpdate('layout', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="horizontal">Horizontal</SelectItem>
            <SelectItem value="vertical">Vertical</SelectItem>
            <SelectItem value="grid">Grid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="button-style">Button Style</Label>
        <Select value={buttonStyle} onValueChange={(value) => onUpdate('buttonStyle', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="show-labels"
          checked={showLabels}
          onCheckedChange={(checked) => onUpdate('showLabels', checked)}
        />
        <Label htmlFor="show-labels">Show Platform Labels</Label>
      </div>

      <div>
        <Label>Enabled Platforms</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {Object.entries(platforms).map(([platform, enabled]) => (
            <div key={platform} className="flex items-center space-x-2">
              <Checkbox
                id={`platform-${platform}`}
                checked={enabled as boolean}
                onCheckedChange={(checked) => updatePlatform(platform, checked as boolean)}
              />
              <Label htmlFor={`platform-${platform}`} className="capitalize">
                {platform === 'copy' ? 'Copy Link' : platform}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
        <p className="font-medium mb-1">Platform Notes:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Facebook: Shares the URL with optional text</li>
          <li>Twitter: Includes both URL and custom text</li>
          <li>LinkedIn: Professional sharing with URL</li>
          <li>WhatsApp: Mobile-friendly sharing</li>
          <li>Email: Opens default email client</li>
        </ul>
      </div>
    </div>
  );
};