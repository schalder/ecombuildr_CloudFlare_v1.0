import React, { useState, useEffect, useRef } from 'react';
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

// Custom HTML/JS Element
const CustomHTMLElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const html = element.content.html || '<div><h3>Custom HTML/JS</h3><p>Add your custom HTML, CSS, and JavaScript here</p></div>';
  const allowDangerousHTML = element.content.allowDangerousHTML || false;
  const [showPreview, setShowPreview] = useState(!isEditing);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const toggleDangerousHTML = () => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...element.content,
          allowDangerousHTML: !allowDangerousHTML
        }
      });
    }
  };

  // Execute scripts when content changes and dangerous HTML is allowed
  useEffect(() => {
    if (!containerRef.current || !html || !allowDangerousHTML) {
      // If dangerous HTML is disabled, just set innerHTML safely
      if (containerRef.current && !allowDangerousHTML) {
        containerRef.current.innerHTML = html;
      }
      return;
    }

    const container = containerRef.current;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Extract and handle style tags
    const styleTags = tempDiv.querySelectorAll('style');
    styleTags.forEach(styleTag => {
      const newStyle = document.createElement('style');
      newStyle.textContent = styleTag.textContent;
      container.appendChild(newStyle);
      styleTag.remove();
    });
    
    // Extract and handle script tags
    const scriptTags = tempDiv.querySelectorAll('script');
    const scripts: { content: string; src?: string }[] = [];
    
    scriptTags.forEach(scriptTag => {
      if (scriptTag.src) {
        scripts.push({ content: '', src: scriptTag.src });
      } else {
        scripts.push({ content: scriptTag.textContent || '' });
      }
      scriptTag.remove();
    });
    
    // Add remaining HTML content
    container.appendChild(tempDiv);
    
    // Execute scripts after DOM is updated
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.content;
      }
      container.appendChild(newScript);
    });
  }, [html, allowDangerousHTML]);

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto p-4 border rounded-lg" style={element.styles}>
        <div className="flex items-center justify-between mb-4">
          <InlineEditor
            value={element.content.title || 'Custom HTML/JS'}
            onChange={handleTitleUpdate}
            className="font-semibold"
            placeholder="HTML/JS block title..."
          />
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={allowDangerousHTML}
                onChange={toggleDangerousHTML}
                className="rounded"
              />
              <span>Enable JS</span>
            </label>
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
            ref={containerRef}
            className="p-4 border rounded-lg bg-background min-h-[200px] overflow-auto"
          />
        ) : (
          <div>
            <Textarea
              value={html}
              onChange={(e) => onUpdate && onUpdate({ content: { ...element.content, html: e.target.value } })}
              placeholder={`Enter your HTML/CSS/JS code here...

Example:
<div style="padding: 20px; background: #f0f0f0; border-radius: 8px;">
  <h2>Hello World</h2>
  <button onclick="alert('Hello!')">Click me</button>
</div>

<style>
  .my-class { color: blue; }
</style>

<script>
  console.log('Custom script executed!');
</script>`}
              rows={15}
              className="font-mono text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Supports HTML elements, CSS within &lt;style&gt; tags, and JavaScript within &lt;script&gt; tags
              </p>
              {!allowDangerousHTML && (
                <p className="text-xs text-amber-600">
                  JavaScript execution is disabled
                </p>
              )}
            </div>
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
      <div 
        ref={containerRef}
        className="min-h-[100px] overflow-auto"
      />
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
  
  const title = element.content.title || '';
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
  
  // Debug containerAlignment
  console.log('Social Share Debug:', {
    elementId: element.id,
    containerAlignment: mergedStyles.containerAlignment,
    allStyles: element.styles,
    mergedStyles
  });
  
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
      {/* Debug container alignment */}
      <div 
        className={`w-full ${getContainerAlignmentClass()}`}
        style={{ 
          display: 'flex',
          justifyContent: containerAlignment === 'left' ? 'flex-start' : 
                        containerAlignment === 'right' ? 'flex-end' : 'center'
        }}
      >
        <div 
          className={`element-${element.id}`}
          style={finalContainerStyles}
        >
          {title && (
            <InlineEditor
              value={title}
              onChange={handleTitleUpdate}
              style={titleStyles}
              placeholder="Share title..."
            />
          )}
          {isEditing && !title && (
            <InlineEditor
              value=""
              onChange={handleTitleUpdate}
              style={titleStyles}
              placeholder="Add share title (optional)..."
            />
          )}
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
    name: 'Custom HTML/JS',
    category: 'custom',
    icon: Code,
    component: CustomHTMLElement,
    defaultContent: {
      title: 'Custom HTML/JS Block',
      html: '<div style="padding: 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">\n  <h3 style="margin-bottom: 10px; font-size: 24px;">🚀 Welcome!</h3>\n  <p style="margin-bottom: 15px; opacity: 0.9;">This is a custom HTML/JS block with interactive features.</p>\n  <button onclick="handleCustomClick()" style="padding: 12px 24px; background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.3); border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.3s ease;" onmouseover="this.style.background=\'rgba(255,255,255,0.3)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.2)\'">✨ Click Me!</button>\n</div>\n\n<style>\n  .custom-pulse {\n    animation: pulse 2s infinite;\n  }\n  @keyframes pulse {\n    0% { transform: scale(1); }\n    50% { transform: scale(1.05); }\n    100% { transform: scale(1); }\n  }\n</style>\n\n<script>\n  function handleCustomClick() {\n    alert("🎉 Hello from your custom HTML/JS block!\\n\\nYou can add any HTML, CSS, and JavaScript here.");\n    console.log("Custom HTML/JS block interaction logged!");\n  }\n  console.log("✅ Custom HTML/JS block loaded successfully!");\n</script>',
      allowDangerousHTML: false
    },
    description: 'Custom HTML/CSS/JS code block with script execution'
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