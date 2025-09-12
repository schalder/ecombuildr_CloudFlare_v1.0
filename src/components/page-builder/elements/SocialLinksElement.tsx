import React from 'react';
import { PageBuilderElement } from '../types';
import { InlineEditor } from '../components/InlineEditor';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialLinksElementProps {
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}

const platformIcons = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
};

export const SocialLinksElement: React.FC<SocialLinksElementProps> = ({ 
  element, 
  isEditing, 
  deviceType = 'desktop', 
  onUpdate 
}) => {
  const title = element.content.title || '';
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

  const layout = element.content.layout || 'horizontal';
  const buttonVariant = element.content.buttonVariant || 'outline';
  const buttonSize = element.content.buttonSize || 'default';
  const showIcons = element.content.showIcons !== false;
  const showLabels = element.content.showLabels || false;
  const iconSpacing = element.content.iconSpacing || 'normal';

  const handleTitleUpdate = (newTitle: string) => {
    if (onUpdate) {
      onUpdate({
        content: { ...element.content, title: newTitle }
      });
    }
  };

  // Get responsive styles - properly access the responsive styles structure
  const baseStyles = element.styles || {};
  const responsiveStyles = baseStyles.responsive || {};
  const currentDeviceStyles = responsiveStyles[deviceType] || {};
  const currentStyles = { ...baseStyles, ...currentDeviceStyles };

  // Container styles
  const containerStyles: React.CSSProperties = {
    textAlign: currentStyles.containerAlignment || 'center',
    maxWidth: currentStyles.maxWidth || 'none',
    margin: '0 auto',
    backgroundColor: currentStyles.backgroundColor && currentStyles.backgroundColor !== 'transparent' && currentStyles.backgroundColor !== 'auto'
      ? currentStyles.backgroundColor 
      : undefined,
    padding: currentStyles.padding || undefined,
    borderRadius: currentStyles.borderRadius || undefined,
    border: currentStyles.borderWidth 
      ? `${currentStyles.borderWidth} solid ${currentStyles.borderColor || 'hsl(var(--border))'}` 
      : undefined,
    boxShadow: currentStyles.boxShadow && currentStyles.boxShadow !== 'none' ? currentStyles.boxShadow : undefined,
    // NOTE: Margins removed - handled by ElementRenderer wrapper to prevent double application
    paddingTop: currentStyles.paddingTop || undefined,
    paddingRight: currentStyles.paddingRight || undefined,
    paddingBottom: currentStyles.paddingBottom || undefined,
    paddingLeft: currentStyles.paddingLeft || undefined,
  };

  // Title styles
  const titleStyles: React.CSSProperties = {
    fontSize: currentStyles.titleFontSize || '18px',
    fontWeight: currentStyles.titleFontWeight || '600',
    color: currentStyles.titleColor && currentStyles.titleColor !== 'auto' ? currentStyles.titleColor : 'currentColor',
    marginBottom: currentStyles.titleMarginBottom || '16px',
  };

  // Button container styles
  const getLayoutClass = (): React.CSSProperties => {
    const layoutType = currentStyles.buttonLayout || layout;
    const spacing = currentStyles.buttonSpacing || '12px';
    const alignment = currentStyles.containerAlignment || 'center';
    
    const baseStyles: React.CSSProperties = {
      display: 'flex',
      gap: spacing,
      justifyContent: alignment === 'left' ? 'flex-start' 
        : alignment === 'right' ? 'flex-end' 
        : 'center',
    };

    if (layoutType === 'vertical') {
      return { ...baseStyles, flexDirection: 'column', alignItems: 'center' };
    } else if (layoutType === 'grid') {
      return { ...baseStyles, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' };
    }
    
    return { ...baseStyles, flexWrap: 'wrap' };
  };

  // Button styles
  const getButtonStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: showIcons && showLabels ? (iconSpacing === 'tight' ? '4px' : iconSpacing === 'wide' ? '12px' : '8px') : '0',
      padding: buttonSize === 'sm' ? '6px 12px' : buttonSize === 'lg' ? '12px 24px' : '8px 16px',
      borderRadius: currentStyles.buttonBorderRadius || '6px',
      fontSize: buttonSize === 'sm' ? '14px' : buttonSize === 'lg' ? '16px' : '14px',
      fontWeight: '500',
      textDecoration: 'none',
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
      backgroundColor: currentStyles.buttonBackgroundColor && currentStyles.buttonBackgroundColor !== 'auto' 
        ? currentStyles.buttonBackgroundColor 
        : (buttonVariant === 'solid' ? 'hsl(var(--primary))' : 'transparent'),
      color: currentStyles.buttonTextColor && currentStyles.buttonTextColor !== 'auto'
        ? currentStyles.buttonTextColor
        : (buttonVariant === 'solid' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'),
      border: buttonVariant === 'outline' 
        ? `${currentStyles.buttonBorderWidth || '1px'} solid ${currentStyles.buttonBorderColor && currentStyles.buttonBorderColor !== 'auto' ? currentStyles.buttonBorderColor : 'hsl(var(--border))'}` 
        : 'none',
    };

    return baseStyles;
  };

  const enabledPlatforms = Object.entries(platforms)
    .filter(([_, enabled]) => enabled)
    .map(([platform]) => platform);

  const handleLinkClick = (platform: string, url: string) => {
    if (!url) return;
    
    // Ensure URL has protocol
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      facebook: 'Facebook',
      twitter: 'Twitter',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      youtube: 'YouTube',
      github: 'GitHub',
    };
    return labels[platform] || platform;
  };

  return (
    <div 
      className={`social-links-element ${isEditing ? 'editing' : ''}`}
      style={containerStyles}
    >
      {title && (
        <InlineEditor
          value={title}
          onChange={handleTitleUpdate}
          style={titleStyles}
          placeholder="Social Links title..."
        />
      )}
      {isEditing && !title && (
        <InlineEditor
          value=""
          onChange={handleTitleUpdate}
          style={titleStyles}
          placeholder="Add social links title (optional)..."
        />
      )}
      
      <div style={getLayoutClass()}>
        {enabledPlatforms.map((platform) => {
          const Icon = platformIcons[platform as keyof typeof platformIcons];
          const url = links[platform as keyof typeof links];
          const hasUrl = Boolean(url);
          
          if (!hasUrl && !isEditing) return null;

          return (
            <button
              key={platform}
              onClick={() => hasUrl ? handleLinkClick(platform, url) : undefined}
              style={getButtonStyles()}
              className={cn(
                "social-link-button",
                !hasUrl && "opacity-50 cursor-not-allowed"
              )}
              disabled={!hasUrl}
              title={!hasUrl ? `Add ${getPlatformLabel(platform)} link in properties` : `Visit ${getPlatformLabel(platform)}`}
            >
              {showIcons && Icon && (
                <Icon size={buttonSize === 'sm' ? 16 : buttonSize === 'lg' ? 20 : 18} />
              )}
              {showLabels && (
                <span>{getPlatformLabel(platform)}</span>
              )}
            </button>
          );
        })}
      </div>
      
      {isEditing && enabledPlatforms.length === 0 && (
        <div className="text-muted-foreground text-sm p-4 border border-dashed rounded">
          Enable social platforms in the properties panel
        </div>
      )}
    </div>
  );
};