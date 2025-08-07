import React, { useState } from 'react';
import { Type, Heading1, Heading2, Heading3, Image, List, Quote, Minus, Play } from 'lucide-react';
import { PageBuilderElement, ElementType } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { elementRegistry } from './ElementRegistry';
import { InlineEditor } from '../components/InlineEditor';
import { renderElementStyles } from '../utils/styleRenderer';
import { generateResponsiveButtonClasses, generateResponsiveButtonStyles, generateResponsivePaddingCSS } from '../utils/responsiveButtonUtils';
import { cn } from '@/lib/utils';

// Heading Element
const HeadingElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType, columnCount = 1 }) => {
  const level = element.content.level || 2;
  const text = element.content.text || 'Heading';
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  const handleTextChange = (newText: string) => {
    onUpdate?.({
      content: { ...element.content, text: newText }
    });
  };

  const elementStyles = renderElementStyles(element);
  const styles = {
    ...elementStyles,
    textAlign: element.styles?.textAlign || (deviceType === 'tablet' ? 'center' : 'left'),
    color: element.styles?.color || 'inherit',
    fontSize: element.styles?.fontSize || `${3.5 - level * 0.5}rem`,
    lineHeight: element.styles?.lineHeight || '1.2',
    backgroundColor: element.styles?.backgroundColor || 'transparent',
  };

  return (
    <Tag 
      style={styles as any} 
      className="outline-none font-bold block rounded"
    >
      <InlineEditor
        value={text}
        onChange={handleTextChange}
        placeholder="Enter heading text..."
        disabled={!isEditing}
        multiline={true}
        className="font-inherit text-inherit leading-tight"
      />
    </Tag>
  );
};

// Paragraph Element  
const ParagraphElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType, columnCount = 1 }) => {
  const text = element.content.text || 'Your text content goes here...';

  const handleTextChange = (newText: string) => {
    onUpdate?.({
      content: { ...element.content, text: newText }
    });
  };

  const elementStyles = renderElementStyles(element);
  const styles = {
    ...elementStyles,
    textAlign: element.styles?.textAlign || (deviceType === 'tablet' ? 'center' : 'left'),
    color: element.styles?.color || 'inherit',
    fontSize: element.styles?.fontSize || '1rem',
    lineHeight: element.styles?.lineHeight || '1.6',
    backgroundColor: element.styles?.backgroundColor || 'transparent',
  };

  return (
    <div 
      style={styles as any} 
      className="outline-none rounded"
    >
      <InlineEditor
        value={text}
        onChange={handleTextChange}
        placeholder="Enter your text content..."
        disabled={!isEditing}
        multiline={true}
        className="text-inherit leading-inherit"
      />
    </div>
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
}> = ({ element, isEditing, onUpdate }) => {
  const items = element.content.items || ['List item 1', 'List item 2', 'List item 3'];
  const isOrdered = element.content.ordered || false;

  const ListTag = isOrdered ? 'ol' : 'ul';

  return (
    <ListTag className={isOrdered ? 'list-decimal list-inside' : 'list-disc list-inside'}>
      {items.map((item: string, index: number) => (
        <li key={index} className="mb-1">{item}</li>
      ))}
    </ListTag>
  );
};

// Button Element
const ButtonElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, deviceType, onUpdate }) => {
  const responsiveStyles = element.styles?.responsive || {};
  const desktopStyles = responsiveStyles.desktop || {};
  const mobileStyles = responsiveStyles.mobile || {};
  
  const text = element.content.text || 'Click Me';
  const url = element.content.url || '#';
  const target = element.content.target || '_blank';

  const handleTextChange = (newText: string) => {
    onUpdate?.({
      content: { ...element.content, text: newText }
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.preventDefault();
    } else if (url && url !== '#') {
      if (target === '_blank') {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
    }
  };

  // Calculate smart padding if none exists
  const getSmartPadding = (fontSize: string, fallback: string) => {
    const size = parseInt(fontSize?.replace(/\D/g, '') || '16');
    const vertical = Math.max(8, size * 0.4);
    const horizontal = Math.max(16, size * 0.8);
    return `${vertical}px ${horizontal}px`;
  };

  // Generate responsive classes
  const getResponsiveClasses = () => {
    const classes = ['cursor-pointer', 'transition-all', 'duration-200', 'inline-flex', 'items-center', 'justify-center', 'font-medium', 'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring', 'focus-visible:ring-offset-2', 'disabled:pointer-events-none', 'disabled:opacity-50'];
    
    // Width handling
    const isFullWidth = element.content.fullWidth || responsiveStyles.fullWidth;
    if (isFullWidth) {
      classes.push('w-full');
    } else {
      classes.push('w-auto');
    }

    // Font size classes
    if (desktopStyles.fontSize) {
      const size = parseInt(desktopStyles.fontSize.replace(/\D/g, ''));
      if (size <= 12) classes.push('lg:text-sm');
      else if (size <= 16) classes.push('lg:text-base');
      else if (size <= 18) classes.push('lg:text-lg');
      else if (size <= 20) classes.push('lg:text-xl');
      else if (size <= 24) classes.push('lg:text-2xl');
      else classes.push('lg:text-3xl');
    } else {
      classes.push('lg:text-base'); // Default desktop size
    }

    if (mobileStyles.fontSize) {
      const size = parseInt(mobileStyles.fontSize.replace(/\D/g, ''));
      if (size <= 12) classes.push('text-sm');
      else if (size <= 16) classes.push('text-base');
      else if (size <= 18) classes.push('text-lg');
      else if (size <= 20) classes.push('text-xl');
      else classes.push('text-2xl');
    } else {
      classes.push('text-sm'); // Default mobile size
    }

    // Font weight
    const desktopWeight = desktopStyles.fontWeight || 'medium';
    const mobileWeight = mobileStyles.fontWeight || 'medium';
    classes.push(`lg:font-${desktopWeight}`);
    classes.push(`font-${mobileWeight}`);

    // Letter spacing
    if (desktopStyles.letterSpacing && desktopStyles.letterSpacing !== 'normal') {
      classes.push(`lg:tracking-${desktopStyles.letterSpacing}`);
    }
    if (mobileStyles.letterSpacing && mobileStyles.letterSpacing !== 'normal') {
      classes.push(`tracking-${mobileStyles.letterSpacing}`);
    }

    // Text transform
    if (desktopStyles.textTransform && desktopStyles.textTransform !== 'none') {
      classes.push(`lg:${desktopStyles.textTransform}`);
    }
    if (mobileStyles.textTransform && mobileStyles.textTransform !== 'none') {
      classes.push(mobileStyles.textTransform);
    }

    return classes.join(' ');
  };

  // Generate inline styles
  const buttonStyles: React.CSSProperties = {
    cursor: 'pointer',
    textAlign: element.styles?.textAlign || 'center',
  };

  // Width handling
  const isFullWidth = element.content.fullWidth || responsiveStyles.fullWidth;
  if (isFullWidth) {
    buttonStyles.width = '100%';
  } else if (element.styles?.width) {
    buttonStyles.width = element.styles.width;
  }

  // Colors with fallbacks
  buttonStyles.backgroundColor = element.styles?.backgroundColor || 'hsl(var(--primary))';
  buttonStyles.color = element.styles?.color || 'hsl(var(--primary-foreground))';

  // Border radius
  if (element.styles?.borderRadius) {
    buttonStyles.borderRadius = element.styles.borderRadius;
  } else {
    buttonStyles.borderRadius = '6px'; // Default rounded
  }

  // Box shadow
  if (element.styles?.boxShadow) {
    buttonStyles.boxShadow = element.styles.boxShadow;
  }

  // Margin
  if (element.styles?.margin) {
    buttonStyles.margin = element.styles.margin;
  }

  // Padding logic
  if (element.styles?.padding) {
    // Global padding takes precedence
    buttonStyles.padding = element.styles.padding;
  } else {
    // Use responsive padding with smart fallbacks
    const mobilePadding = mobileStyles.padding || getSmartPadding(mobileStyles.fontSize, '8px 16px');
    buttonStyles.padding = mobilePadding;
  }

  // Generate responsive CSS for desktop padding
  const responsivePaddingCSS = () => {
    if (element.styles?.padding) return ''; // Global padding takes precedence
    
    const desktopPadding = desktopStyles.padding || getSmartPadding(desktopStyles.fontSize, '12px 24px');
    
    return `
      @media (min-width: 1024px) {
        .responsive-button-${element.id} {
          padding: ${desktopPadding} !important;
        }
      }
    `;
  };

  const alignment = element.styles?.textAlign || 'left';
  const containerClass = 
    alignment === 'center' ? 'flex justify-center' :
    alignment === 'right' ? 'flex justify-end' : 
    'flex justify-start';

  const buttonClasses = cn(
    getResponsiveClasses(),
    `responsive-button-${element.id}`
  );

  if (isEditing) {
    return (
      <div className={containerClass}>
        <style dangerouslySetInnerHTML={{ __html: responsivePaddingCSS() }} />
        <div
          className={buttonClasses}
          style={buttonStyles}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            className="bg-transparent border-none outline-none text-center w-full text-inherit font-inherit"
            placeholder="Button Text"
            style={{ color: 'inherit' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <style dangerouslySetInnerHTML={{ __html: responsivePaddingCSS() }} />
      <button
        className={buttonClasses}
        style={buttonStyles}
        onClick={handleClick}
        id={element.content.customId || element.id}
      >
        {text}
      </button>
    </div>
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
}> = ({ element, isEditing, onUpdate }) => {
  const { 
    videoType = 'url',
    url = '', 
    embedCode = '',
    width = 'full',
    controls = true, 
    autoplay = false,
    muted = false
  } = element.content;
  
  const containerStyles = renderElementStyles(element);

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

  const widthClasses = getVideoWidthClasses(String(width));

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
      ordered: false 
    },
    description: 'Bullet or numbered lists'
  });
};
