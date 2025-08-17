import React, { useState } from 'react';
import { Type, Heading1, Heading2, Heading3, Image, List, Quote, Minus, Play } from 'lucide-react';
import { PageBuilderElement, ElementType } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { elementRegistry } from './ElementRegistry';
import { InlineEditor } from '../components/InlineEditor';
import { InlineRTE, sanitizeHtml } from '../components/InlineRTE';
import { renderElementStyles } from '../utils/styleRenderer';
import { generateResponsiveCSS } from '../utils/responsiveStyles';
import { ICONS_MAP } from '@/components/icons/lucide-icon-list';
import { useEcomPaths } from '@/lib/pathResolver';

// Heading Element
const HeadingElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType = 'desktop', columnCount = 1 }) => {
  const level = element.content.level || 2;
  const text = element.content.text || 'Heading';
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  const handleTextChange = (newText: string) => {
    onUpdate?.({
      content: { ...element.content, text: newText }
    });
  };

  // Base styles and defaults
  const elementStyles = renderElementStyles(element);
  const baseStyles = {
    ...elementStyles,
    textAlign: element.styles?.textAlign || (deviceType === 'tablet' ? 'center' : 'left'),
    color: element.styles?.color || 'inherit',
    fontSize: element.styles?.fontSize || `${3.5 - level * 0.5}rem`,
    lineHeight: element.styles?.lineHeight || '1.2',
    backgroundColor: element.styles?.backgroundColor || 'transparent',
  } as React.CSSProperties;

  // Responsive overrides
  const responsive = element.styles?.responsive || {};
  const deviceKey = deviceType === 'tablet' ? 'desktop' : deviceType;
  const currentDeviceStyles = (responsive as any)[deviceKey] || {};

  const finalStyles = { ...baseStyles, ...currentDeviceStyles } as React.CSSProperties;
  const cleanStyles = Object.fromEntries(
    Object.entries(finalStyles).filter(([_, v]) => v !== undefined && v !== '')
  ) as React.CSSProperties;

  const className = [`element-${element.id}`, 'outline-none font-bold block rounded'].join(' ');

  return (
    <>
      <style>{generateResponsiveCSS(element.id, element.styles)}</style>
      <Tag style={cleanStyles} className={className}>
        {isEditing ? (
          <InlineRTE
            value={text}
            onChange={handleTextChange}
            placeholder="Enter heading text..."
            disabled={false}
            className="font-inherit leading-tight"
            style={{ textAlign: cleanStyles.textAlign as any }}
          />
        ) : (
          <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} />
        )}
      </Tag>
    </>
  );
};

// Paragraph Element  
const ParagraphElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType = 'desktop', columnCount = 1 }) => {
  const text = element.content.text || 'Your text content goes here...';

  const handleTextChange = (newText: string) => {
    onUpdate?.({
      content: { ...element.content, text: newText }
    });
  };

  // Base styles and defaults
  const elementStyles = renderElementStyles(element);
  const baseStyles = {
    ...elementStyles,
    textAlign: element.styles?.textAlign || (deviceType === 'tablet' ? 'center' : 'left'),
    color: element.styles?.color || 'inherit',
    fontSize: element.styles?.fontSize || '1rem',
    lineHeight: element.styles?.lineHeight || '1.6',
    backgroundColor: element.styles?.backgroundColor || 'transparent',
  } as React.CSSProperties;

  // Responsive overrides
  const responsive = element.styles?.responsive || {};
  const deviceKey = deviceType === 'tablet' ? 'desktop' : deviceType;
  const currentDeviceStyles = (responsive as any)[deviceKey] || {};

  const finalStyles = { ...baseStyles, ...currentDeviceStyles } as React.CSSProperties;
  const cleanStyles = Object.fromEntries(
    Object.entries(finalStyles).filter(([_, v]) => v !== undefined && v !== '')
  ) as React.CSSProperties;

  const className = [`element-${element.id}`, 'outline-none rounded'].join(' ');

  return (
    <>
      <style>{generateResponsiveCSS(element.id, element.styles)}</style>
      <div style={cleanStyles} className={className}>
        {isEditing ? (
          <InlineRTE
            value={text}
            onChange={handleTextChange}
            placeholder="Enter your text content..."
            disabled={false}
            className="leading-inherit"
            style={{ textAlign: cleanStyles.textAlign as any }}
          />
        ) : (
          <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} />
        )}
      </div>
    </>
  );
};

// Image Element
const ImageElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const { src, alt, caption, alignment = 'center', linkUrl, linkTarget = '_self' } = element.content;
  const containerStyles = renderElementStyles(element);
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(false);

  // Reset error state when URL changes
  React.useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [src]);

  if (!src) {
    return (
      <div className="w-full h-48 bg-muted flex items-center justify-center border-2 border-dashed border-border rounded-lg">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No image selected</p>
          <p className="text-xs text-muted-foreground">Use the properties panel to add an image</p>
        </div>
      </div>
    );
  }

  const alignmentClasses = {
    left: 'flex justify-start',
    center: 'flex justify-center',
    right: 'flex justify-end',
    full: 'w-full'
  };

  const imageStyles: React.CSSProperties = {
    width: element.styles?.width || 'auto',
    height: element.styles?.height || 'auto',
    maxWidth: element.styles?.maxWidth || (alignment === 'full' ? '100%' : undefined),
    objectFit: element.styles?.objectFit || 'cover'
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const ImageComponent = () => {
    if (imageError) {
      return (
        <div className="w-full h-48 bg-muted flex items-center justify-center border border-destructive rounded-lg">
          <div className="text-center text-destructive">
            <p className="text-sm">Failed to load image</p>
            <p className="text-xs mt-1">Check the URL and try again</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        {imageLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-lg flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        )}
        <img
          src={src}
          alt={alt || ''}
          className="rounded-lg"
          style={imageStyles}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    );
  };

  const imageContent = linkUrl ? (
    <a 
      href={linkUrl} 
      target={linkTarget}
      className="inline-block"
    >
      <ImageComponent />
    </a>
  ) : (
    <ImageComponent />
  );

  return (
    <figure 
      className={`my-4 ${alignmentClasses[alignment] || alignmentClasses.center}`}
      style={containerStyles}
    >
      <div className={alignment === 'full' ? 'w-full' : 'inline-block'}>
        {imageContent}
        {caption && (
          <figcaption className="text-sm text-muted-foreground mt-2 text-center">
            {caption}
          </figcaption>
        )}
      </div>
    </figure>
  );
};

// List Element
const ListElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType = 'desktop' }) => {
  const rawItems = element.content.items || ['List item 1', 'List item 2', 'List item 3'];
  const style: 'bullets' | 'numbers' | 'icons' = element.content.style || (element.content.ordered ? 'numbers' : 'bullets');
  const defaultIcon: string = element.content.defaultIcon || 'check';

  type Item = string | { text: string; icon?: string };
  const items: { text: string; icon?: string }[] = (rawItems as Item[]).map((it) =>
    typeof it === 'string' ? { text: it, icon: defaultIcon } : { text: it.text, icon: it.icon || defaultIcon }
  );

  const baseStyles = renderElementStyles(element);

  // Responsive overrides for list-specific styles
  const responsive = element.styles?.responsive || {};
  const deviceKey = deviceType === 'tablet' ? 'desktop' : deviceType;
  const currentDeviceStyles: any = (responsive as any)[deviceKey] || {};

  const iconSize: number = currentDeviceStyles.iconSize ?? (element.styles as any)?.iconSize ?? 16;
  const itemGap: number = currentDeviceStyles.itemGap ?? (element.styles as any)?.itemGap ?? 4;
  const indent: number = currentDeviceStyles.indent ?? (element.styles as any)?.indent ?? 0;
  const iconColor: string | undefined = currentDeviceStyles.iconColor ?? (element.styles as any)?.iconColor ?? undefined;

  const containerStyles: React.CSSProperties = {
    ...baseStyles,
    paddingLeft: indent ? `${indent}px` : baseStyles.paddingLeft,
  };

  let listNode: React.ReactNode;

  if (style === 'numbers') {
    listNode = (
      <ol style={containerStyles} className={`element-${element.id} list-decimal list-inside`}>
        {items.map((item, index) => (
          <li key={index} className="mb-1" style={{ marginBottom: `${itemGap}px` }}>{item.text}</li>
        ))}
      </ol>
    );
  } else if (style === 'icons') {
    listNode = (
      <ul style={containerStyles} className={`element-${element.id} list-none pl-0`}>
        {items.map((item, index) => {
          const iconName = item.icon || defaultIcon;
          const faIcon = ICONS_MAP[iconName] || ICONS_MAP['check'];
          return (
            <li key={index} className="mb-1 flex items-start" style={{ marginBottom: `${itemGap}px` }}>
              <span className="mr-2 mt-0.5" style={{ fontSize: `${iconSize}px`, lineHeight: 1, color: iconColor }}>
                {React.createElement(faIcon, { className: "h-4 w-4" })}
              </span>
              <span>{item.text}</span>
            </li>
          );
        })}
      </ul>
    );
  } else {
    listNode = (
      <ul style={containerStyles} className={`element-${element.id} list-disc list-inside`}>
        {items.map((item, index) => (
          <li key={index} className="mb-1" style={{ marginBottom: `${itemGap}px` }}>{item.text}</li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <style>{generateResponsiveCSS(element.id, element.styles)}</style>
      {listNode}
    </>
  );
};

// Button Element
const ButtonElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, deviceType = 'desktop', onUpdate }) => {
  const text = element.content.text || 'Button';
  const variant = element.content.variant || 'default';
  const rawSize = element.content.size;
  const size = (rawSize === 'icon' ? 'default' : rawSize) || 'default';
  const url = element.content.url || '#';
  const target = element.content.target || '_blank';

  const linkType: 'page' | 'url' | 'scroll' | undefined = element.content.linkType || (element.content.url ? 'url' : undefined);
  const pageSlug: string | undefined = element.content.pageSlug;
  const scrollTarget: string | undefined = element.content.scrollTarget;
  const paths = useEcomPaths();

  const computedUrl = React.useMemo(() => {
    if (linkType === 'page') {
      return pageSlug ? `${paths.base}/${pageSlug}` : paths.home;
    }
    if (linkType === 'url' || !linkType) {
      return url;
    }
    return '#';
  }, [linkType, pageSlug, paths.base, paths.home, url]);

  const handleTextChange = (newText: string) => {
    onUpdate?.({
      content: { ...element.content, text: newText }
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    // Handle in-page scroll always within editor/live
    if (linkType === 'scroll') {
      e.preventDefault();
      e.stopPropagation();
      const raw = (scrollTarget || '').replace(/^#/, '');

      const tryFind = (id: string): HTMLElement | null => {
        return (document.getElementById(id) as HTMLElement | null) || null;
      };

      const tryLegacy = (legacy: string): HTMLElement | null => {
        const patterns: Array<[RegExp, string]> = [
          [/^pb-section-(.+)$/i, 'section'],
          [/^pb-row-(.+)$/i, 'row'],
          [/^pb-column-(.+)$/i, 'column'],
          [/^pb-col-(.+)$/i, 'column'],
          [/^pb-el-(.+)$/i, 'element'],
          [/^pb-element-(.+)$/i, 'element'],
        ];
        for (const [rx, kind] of patterns) {
          const m = legacy.match(rx);
          if (m) {
            const innerId = m[1];
            const node = document.querySelector(`[data-pb-${kind}-id="${innerId}"]`) as HTMLElement | null;
            if (node) return node;
          }
        }
        return null;
      };

      if (raw) {
        const targetEl = tryFind(raw)
          || tryLegacy(raw)
          || (document.querySelector(`[data-pb-section-id="${raw}"]`) as HTMLElement | null)
          || (document.querySelector(`[data-pb-row-id="${raw}"]`) as HTMLElement | null)
          || (document.querySelector(`[data-pb-column-id="${raw}"]`) as HTMLElement | null)
          || (document.querySelector(`[data-pb-element-id="${raw}"]`) as HTMLElement | null);
        if (targetEl && 'scrollIntoView' in targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      return;
    }

    const finalUrl = computedUrl;
    if (!finalUrl || finalUrl === '#') {
      e.preventDefault();
      return;
    }

    if (isEditing) {
      // Allow testing links in editor with cmd/ctrl-click or target=_blank
      if (e.metaKey || e.ctrlKey || target === '_blank') {
        e.preventDefault();
        window.open(finalUrl, '_blank');
      } else {
        e.preventDefault();
      }
      return;
    }

    if (target === '_blank') {
      window.open(finalUrl, '_blank');
    } else {
      window.location.href = finalUrl;
    }
  };

  // Get responsive alignment
  const responsiveStyles = element.styles?.responsive || {};
  const currentDeviceStyles = responsiveStyles[deviceType === 'tablet' ? 'desktop' : deviceType] || {};
  const alignment = currentDeviceStyles.textAlign || element.styles?.textAlign || 'left';
  
  const containerClass = 
    alignment === 'center' ? 'flex justify-center' :
    alignment === 'right' ? 'flex justify-end' : 
    'flex justify-start';

  // Use renderElementStyles for consistent styling
  const elementStyles = renderElementStyles(element, deviceType);

  // Smart padding fallback when no padding is set
  const hasExistingPadding = elementStyles.padding || elementStyles.paddingTop || elementStyles.paddingRight || 
                           elementStyles.paddingBottom || elementStyles.paddingLeft;
  
  if (!hasExistingPadding) {
    const fontSize = String(elementStyles.fontSize || '16px');
    const size = parseInt(fontSize.replace(/\D/g, ''));
    if (size <= 12) elementStyles.padding = '6px 12px';
    else if (size <= 16) elementStyles.padding = '8px 16px';
    else if (size <= 20) elementStyles.padding = '10px 20px';
    else if (size <= 24) elementStyles.padding = '12px 24px';
    else if (size <= 32) elementStyles.padding = '16px 32px';
    else elementStyles.padding = '20px 40px';
  }

  // Handle width for full width behavior
  const isFullWidth = elementStyles.width === '100%';
  
  // Generate responsive CSS
  const responsiveCSS = generateResponsiveCSS(element.id, element.styles);

  const customClassName = [
    `element-${element.id}`,
    'outline-none cursor-pointer transition-all duration-200',
    isFullWidth ? 'w-full' : ''
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Inject responsive CSS */}
      {responsiveCSS && <style>{responsiveCSS}</style>}
      
      <div className={containerClass}>
        <Button 
          variant={variant as any} 
          size={size as any}
          className={customClassName}
          onClick={handleClick}
          style={elementStyles}
        >
          {isEditing ? (
            <InlineEditor
              value={text}
              onChange={handleTextChange}
              placeholder="Button text..."
              disabled={false}
              className="text-inherit font-inherit bg-transparent border-0 outline-none ring-0 focus:ring-0"
            />
          ) : (
            text
          )}
        </Button>
      </div>
    </>
  );
};

// Spacer Element
const SpacerElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const height = element.content.height || '50px';

  const handleHeightChange = (newHeight: string) => {
    // Convert string height to number (remove 'px' and parse)
    const numericHeight = parseInt(newHeight.replace('px', '')) || 50;
    onUpdate?.({
      content: { ...element.content, height: numericHeight }
    });
  };

  const elementStyles = renderElementStyles(element);

  if (isEditing) {
    return (
      <div className="border border-dashed border-muted-foreground/30 rounded p-4 text-center bg-muted/10">
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <span>Spacer:</span>
          <InlineEditor
            value={String(height)}
            onChange={handleHeightChange}
            placeholder="50px"
            disabled={false}
            className="w-16 text-center"
          />
        </div>
      </div>
    );
  }

  const spacerHeight = String(height);
  
  return (
    <div style={{ ...elementStyles, height: elementStyles.height || spacerHeight }} className="w-full" />
  );
};

// Divider Element
const DividerElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const style = element.content.style || 'solid';
  const color = element.content.color || '#e5e7eb';
  const width = element.content.width || '100%';

  const elementStyles = renderElementStyles(element);
  const dividerStyle = {
    ...elementStyles,
    borderTop: `1px ${style} ${color}`,
    width,
    margin: element.styles?.margin || '20px 0',
  };

  if (isEditing) {
    return (
      <div className="border border-dashed border-muted-foreground/30 rounded p-2 bg-muted/10">
        <hr style={dividerStyle} />
        <div className="text-xs text-muted-foreground text-center mt-2">
          Divider
        </div>
      </div>
    );
  }

  return <hr style={dividerStyle} className="border-none" />;
};

// Video Element
const VideoElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, deviceType, onUpdate }) => {
  const { 
    videoType = 'url',
    url = '', 
    embedCode = '',
    width = 'full',
    widthByDevice,
    controls = true, 
    autoplay = false,
    muted = false
  } = element.content as any;
  
  const containerStyles = renderElementStyles(element, (deviceType ?? 'desktop'));
  const activeDevice: 'desktop' | 'mobile' = (deviceType === 'mobile' ? 'mobile' : 'desktop');
  const effectiveWidth = (widthByDevice?.[activeDevice] as string) || (width as string);
  // Import video utilities
  const { parseVideoUrl, getVideoWidthClasses, buildEmbedUrl, sanitizeEmbedCode } = React.useMemo(() => {
    return {
      parseVideoUrl: (url: string) => {
        if (!url) return { type: 'unknown' as const };
        
        // YouTube patterns
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = url.match(youtubeRegex);
        if (youtubeMatch) {
          const id = youtubeMatch[1];
          return {
            type: 'youtube' as const,
            id,
            embedUrl: `https://www.youtube.com/embed/${id}`
          };
        }

        // Vimeo patterns
        const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)(?:\?.*)?/;
        const vimeoMatch = url.match(vimeoRegex);
        if (vimeoMatch) {
          const id = vimeoMatch[1];
          return {
            type: 'vimeo' as const,
            id,
            embedUrl: `https://player.vimeo.com/video/${id}`
          };
        }

        // Wistia patterns
        const wistiaRegex = /(?:wistia\.(?:com|net)\/(?:medias|embed)\/|wi\.st\/)([a-zA-Z0-9]+)/;
        const wistiaMatch = url.match(wistiaRegex);
        if (wistiaMatch) {
          const id = wistiaMatch[1];
          return {
            type: 'wistia' as const,
            id,
            embedUrl: `https://fast.wistia.net/embed/iframe/${id}`
          };
        }

        // Check if it's a direct video file
        const videoFileRegex = /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i;
        if (videoFileRegex.test(url)) {
          return {
            type: 'hosted' as const,
            embedUrl: url
          };
        }

        return { type: 'unknown' as const };
      },
      getVideoWidthClasses: (width: string) => {
        switch (width) {
          case 'full': return 'w-full';
          case 'three-quarters': return 'w-3/4 mx-auto';
          case 'half': return 'w-1/2 mx-auto';
          default: return 'w-full';
        }
      },
      buildEmbedUrl: (baseUrl: string, type: string, options: any = {}) => {
        const urlObj = new URL(baseUrl);
        
        switch (type) {
          case 'youtube':
            if (options.autoplay) urlObj.searchParams.set('autoplay', '1');
            if (!options.controls) urlObj.searchParams.set('controls', '0');
            if (options.muted) urlObj.searchParams.set('mute', '1');
            urlObj.searchParams.set('rel', '0');
            break;
            
          case 'vimeo':
            if (options.autoplay) urlObj.searchParams.set('autoplay', '1');
            if (!options.controls) urlObj.searchParams.set('controls', '0');
            if (options.muted) urlObj.searchParams.set('muted', '1');
            break;
            
          case 'wistia':
            if (options.autoplay) urlObj.searchParams.set('autoPlay', 'true');
            if (!options.controls) urlObj.searchParams.set('playbar', 'false');
            if (options.muted) urlObj.searchParams.set('volume', '0');
            break;
        }
        
        return urlObj.toString();
      },
      sanitizeEmbedCode: (embedCode: string) => {
        return embedCode
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    };
  }, []);

  if (isEditing && videoType === 'url' && !url) {
    return (
      <div 
        className="w-full h-48 bg-muted flex items-center justify-center border-2 border-dashed border-border rounded-lg"
        style={containerStyles}
      >
        <p className="text-sm text-muted-foreground">Add a video URL in the properties panel</p>
      </div>
    );
  }

  if (isEditing && videoType === 'embed' && !embedCode) {
    return (
      <div 
        className="w-full h-48 bg-muted flex items-center justify-center border-2 border-dashed border-border rounded-lg"
        style={containerStyles}
      >
        <p className="text-sm text-muted-foreground">Add custom embed code in the properties panel</p>
      </div>
    );
  }

  const widthClasses = getVideoWidthClasses(String(effectiveWidth));

  // Handle custom embed code
  if (videoType === 'embed' && embedCode) {
    const sanitizedCode = sanitizeEmbedCode(embedCode);
    return (
      <div className={`${widthClasses} aspect-video`} style={containerStyles}>
        <div 
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: sanitizedCode }}
        />
      </div>
    );
  }

  // Handle URL-based videos
  if (videoType === 'url' && url) {
    const videoInfo = parseVideoUrl(url);
    
    if (videoInfo.type === 'hosted') {
      // Direct video file
      return (
        <div className={`${widthClasses} aspect-video`} style={containerStyles}>
          <video
            src={url}
            controls={controls}
            autoPlay={autoplay}
            muted={muted}
            className="w-full h-full rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (videoInfo.embedUrl && ['youtube', 'vimeo', 'wistia'].includes(videoInfo.type)) {
      // Embedded video services
      const finalEmbedUrl = buildEmbedUrl(videoInfo.embedUrl, videoInfo.type, {
        autoplay,
        controls,
        muted
      });

      return (
        <div className={`${widthClasses} aspect-video`} style={containerStyles}>
          <iframe
            src={finalEmbedUrl}
            className="w-full h-full rounded-lg"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  // Fallback for invalid or unrecognized video
  return (
    <div 
      className={`${widthClasses} aspect-video bg-muted flex items-center justify-center border-2 border-dashed border-border rounded-lg`}
      style={containerStyles}
    >
      <p className="text-sm text-muted-foreground">
        {videoType === 'url' ? 'Invalid video URL' : 'No video content'}
      </p>
    </div>
  );
};

// Register all basic elements
export const registerBasicElements = () => {
  // Heading Elements
  elementRegistry.register({
    id: 'heading',
    name: 'Heading',
    category: 'basic',
    icon: Type,
    component: HeadingElement,
    defaultContent: { text: 'Your heading text', level: 2 },
    description: 'Add a title or heading'
  });

  // Paragraph
  elementRegistry.register({
    id: 'text',
    name: 'Text Editor',
    category: 'basic',
    icon: Type,
    component: ParagraphElement,
    defaultContent: { text: 'Your text content goes here...' },
    description: 'Rich text content'
  });

  // Button
  elementRegistry.register({
    id: 'button',
    name: 'Button',
    category: 'basic',
    icon: Quote,
    component: ButtonElement,
    defaultContent: { text: 'Click Me', variant: 'default', size: 'default', url: '#' },
    description: 'Call to action button'
  });

  // Image
  elementRegistry.register({
    id: 'image',
    name: 'Image',
    category: 'basic',
    icon: Image,
    component: ImageElement,
    defaultContent: { src: '', alt: 'Image', width: '100%', height: 'auto' },
    description: 'Single image element'
  });

  // Video
  elementRegistry.register({
    id: 'video',
    name: 'Video',
    category: 'basic',
    icon: Play,
    component: VideoElement,
    defaultContent: { src: '', controls: true, autoplay: false },
    description: 'Video player'
  });

  // Spacer
  elementRegistry.register({
    id: 'spacer',
    name: 'Spacer',
    category: 'basic',
    icon: Minus,
    component: SpacerElement,
    defaultContent: { height: '50px' },
    description: 'Add space between elements'
  });

  // Divider
  elementRegistry.register({
    id: 'divider',
    name: 'Divider',
    category: 'basic',
    icon: Minus,
    component: DividerElement,
    defaultContent: { style: 'solid', width: '100%', color: '#e5e7eb' },
    description: 'Visual separator line'
  });

  // List
  elementRegistry.register({
    id: 'list',
    name: 'List',
    category: 'basic',
    icon: List,
    component: ListElement,
    defaultContent: { 
      items: ['List item 1', 'List item 2', 'List item 3'], 
      ordered: false,
      style: 'bullets',
      defaultIcon: 'check'
    },
    description: 'Bullet, numbered, or icon lists'
  });
};
