import React, { useState } from 'react';
import { MapPin, Code, Share2, Facebook, Twitter, Linkedin, Link2, MessageCircle, Send, Mail, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';
import { InlineEditor } from '../components/InlineEditor';
import { generateResponsiveCSS, mergeResponsiveStyles } from '../utils/responsiveStyles';

// Google Maps Element
const GoogleMapsElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const apiKey = element.content.apiKey || '';
  const location = element.content.location || 'New York, NY';
  const zoom = element.content.zoom || 15;
  const mapType = element.content.mapType || 'roadmap';
  const height = element.content.height || 400;
  const showMarker = element.content.showMarker !== false;
  const markerTitle = element.content.markerTitle || '';

  const handleTitleUpdate = (newTitle: string) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...element.content,
          title: newTitle
        }
      });
    }
  };

  const embedUrl = apiKey 
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(location)}&zoom=${zoom}&maptype=${mapType}`
    : null;

  return (
    <div className="max-w-4xl mx-auto" style={element.styles}>
      <InlineEditor
        value={element.content.title || 'Location'}
        onChange={handleTitleUpdate}
        className="text-xl font-semibold mb-4"
        placeholder="Map title..."
      />
      <div 
        className="w-full rounded-lg overflow-hidden border"
        style={{ height: `${height}px` }}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={markerTitle || location}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-center p-6">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-foreground mb-2">Google Maps Preview</p>
              <p className="text-sm text-muted-foreground mb-2">{location}</p>
              <p className="text-xs text-muted-foreground">
                Add your Google Maps API key in the properties panel to display the live map
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom HTML Element
const CustomHTMLElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const html = element.content.html || '<div><h3>Custom HTML</h3><p>Add your custom HTML here</p></div>';
  const allowDangerousHTML = element.content.allowDangerousHTML || false;
  const [showPreview, setShowPreview] = useState(!isEditing);

  const handleTitleUpdate = (newTitle: string) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...element.content,
          title: newTitle
        }
      });
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto p-4 border rounded-lg" style={element.styles}>
        <div className="flex items-center justify-between mb-4">
          <InlineEditor
            value={element.content.title || 'Custom HTML'}
            onChange={handleTitleUpdate}
            className="font-semibold"
            placeholder="HTML block title..."
          />
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => setShowPreview(!showPreview)} 
              size="sm" 
              variant="outline"
            >
              {showPreview ? 'Edit Code' : 'Preview'}
            </Button>
          </div>
        </div>
        
        {showPreview ? (
          <div 
            className="p-4 border rounded-lg bg-background min-h-[200px]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div>
            <Textarea
              value={html}
              onChange={(e) => onUpdate && onUpdate({ content: { ...element.content, html: e.target.value } })}
              placeholder="Enter your HTML code here..."
              rows={12}
              className="font-mono text-sm"
            />
            {!allowDangerousHTML && (
              <p className="text-xs text-muted-foreground mt-2">
                Scripts and external content are disabled for security. Enable in properties panel if needed.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" style={element.styles}>
      {element.content.title && (
        <h3 className="text-xl font-semibold mb-4">{element.content.title}</h3>
      )}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

// Social Share Element
const SocialShareElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, deviceType = 'desktop', onUpdate }) => {
  const { toast } = useToast();
  
  const title = element.content.title || 'Share this page';
  const url = element.content.url || window.location.href;
  const text = element.content.text || 'Check out this amazing content!';
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

  // Get merged styles (base + responsive)
  const mergedStyles = mergeResponsiveStyles(element.styles || {}, element.styles, deviceType);
  
  // Get container alignment for positioning element within column
  const containerAlignment = mergedStyles.containerAlignment || 'center';
  
  // Get container alignment class (like PriceElement)
  const getContainerAlignmentClass = () => {
    switch (containerAlignment) {
      case 'left': return 'mr-auto';
      case 'right': return 'ml-auto';
      default: return 'mx-auto'; // center
    }
  };

  const containerStyles = {
    maxWidth: mergedStyles.maxWidth === 'none' ? 'none' : (mergedStyles.maxWidth || '32rem'),
    backgroundColor: mergedStyles.backgroundColor || 'transparent',
    backgroundOpacity: mergedStyles.backgroundOpacity || 100,
    borderWidth: mergedStyles.borderWidth || '0',
    borderColor: mergedStyles.borderColor || 'transparent',
    borderRadius: mergedStyles.borderRadius || '0px',
    boxShadow: mergedStyles.boxShadow || 'none',
    paddingTop: mergedStyles.paddingTop || '0',
    paddingRight: mergedStyles.paddingRight || '0',
    paddingBottom: mergedStyles.paddingBottom || '0',
    paddingLeft: mergedStyles.paddingLeft || '0',
    marginTop: mergedStyles.marginTop || '0',
    marginRight: mergedStyles.marginRight || '0',
    marginBottom: mergedStyles.marginBottom || '0',
    marginLeft: mergedStyles.marginLeft || '0',
  };

  const titleStyles = {
    fontSize: mergedStyles.titleFontSize || '18px',
    fontWeight: mergedStyles.titleFontWeight || 'semibold',
    color: mergedStyles.titleColor || 'inherit',
    marginBottom: mergedStyles.titleMarginBottom || '16px',
  };

  const buttonLayoutFromStyles = mergedStyles.buttonLayout || layout;
  const buttonSpacing = mergedStyles.buttonSpacing || '12px';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
  };

  const platformIcons = {
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    whatsapp: MessageCircle,
    telegram: Send,
    reddit: ExternalLink,
    email: Mail,
    copy: Link2
  };

  const handleTitleUpdate = (newTitle: string) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...element.content,
          title: newTitle
        }
      });
    }
  };

  const handleShare = (platform: string) => {
    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast({
        title: "Success",
        description: "Link copied to clipboard!",
      });
      return;
    }

    const link = shareLinks[platform as keyof typeof shareLinks];
    if (link) {
      window.open(link, '_blank', 'width=600,height=400');
    }
  };

  const getLayoutClass = () => {
    switch (buttonLayoutFromStyles) {
      case 'vertical': 
        return {
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          gap: buttonSpacing
        };
      case 'grid': 
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: buttonSpacing,
          justifyContent: 'center'
        };
      default: 
        return {
          display: 'flex',
          justifyContent: 'center',
          gap: buttonSpacing,
          flexWrap: 'wrap' as const
        };
    }
  };

  const getButtonVariant = () => {
    const styleVariant = mergedStyles.buttonVariant || buttonStyle;
    switch (styleVariant) {
      case 'outline': return 'outline';
      case 'ghost': return 'ghost';
      case 'default': return 'default';
      default: return 'outline';
    }
  };

  const getButtonSize = () => {
    return mergedStyles.buttonSize || 'sm';
  };

  const getButtonStyles = () => {
    const buttonStyles: React.CSSProperties = {};
    
    if (mergedStyles.buttonTextColor) buttonStyles.color = mergedStyles.buttonTextColor;
    if (mergedStyles.buttonBackgroundColor) buttonStyles.backgroundColor = mergedStyles.buttonBackgroundColor;
    if (mergedStyles.buttonBorderWidth) buttonStyles.borderWidth = mergedStyles.buttonBorderWidth;
    if (mergedStyles.buttonBorderColor) buttonStyles.borderColor = mergedStyles.buttonBorderColor;
    if (mergedStyles.buttonBorderRadius) buttonStyles.borderRadius = mergedStyles.buttonBorderRadius;
    
    return buttonStyles;
  };

  const enabledPlatforms = Object.entries(platforms)
    .filter(([_, enabled]) => enabled)
    .map(([platform]) => platform);

  // Generate responsive CSS if needed
  const responsiveCSS = generateResponsiveCSS(element.id, element.styles);

  // Apply background opacity if set
  const finalContainerStyles = {
    ...containerStyles,
    backgroundColor: containerStyles.backgroundColor !== 'transparent' 
      ? `${containerStyles.backgroundColor}${Math.round((containerStyles.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')}`
      : containerStyles.backgroundColor
  };

  return (
    <>
      {responsiveCSS && (
        <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />
      )}
      {/* Outer container for alignment positioning */}
      <div className={`${getContainerAlignmentClass()}`}>
        <div 
          className={`element-${element.id}`}
          style={finalContainerStyles}
        >
          <InlineEditor
            value={title}
            onChange={handleTitleUpdate}
            style={titleStyles}
            placeholder="Share title..."
          />
          <div style={getLayoutClass()}>
            {enabledPlatforms.map((platform) => {
              const Icon = platformIcons[platform as keyof typeof platformIcons];
              const label = platform === 'copy' ? 'Copy Link' : platform.charAt(0).toUpperCase() + platform.slice(1);
              
              return (
                <Button
                  key={platform}
                  size={getButtonSize() as any}
                  variant={getButtonVariant() as any}
                  onClick={() => handleShare(platform)}
                  style={getButtonStyles()}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  {showLabels && <span>{label}</span>}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

// Register Advanced Elements
export const registerAdvancedElements = () => {
  elementRegistry.register({
    id: 'google-maps',
    name: 'Google Maps',
    category: 'custom',
    icon: MapPin,
    component: GoogleMapsElement,
    defaultContent: {
      title: 'Location',
      location: 'New York, NY'
    },
    description: 'Interactive Google Maps embed'
  });

  elementRegistry.register({
    id: 'custom-html',
    name: 'Custom HTML',
    category: 'custom',
    icon: Code,
    component: CustomHTMLElement,
    defaultContent: {
      html: '<div><h3>Custom HTML</h3><p>Add your custom HTML here</p></div>'
    },
    description: 'Custom HTML code block'
  });

  elementRegistry.register({
    id: 'social-share',
    name: 'Social Share',
    category: 'marketing',
    icon: Share2,
    component: SocialShareElement,
    defaultContent: {
      title: 'Share this page',
      text: 'Check out this amazing content!',
      url: ''
    },
    description: 'Social media sharing buttons'
  });
};