import React, { useState } from 'react';
import { Type, Heading1, Heading2, Heading3, Image, List, RectangleHorizontal, Minus, Play } from 'lucide-react';
import { PageBuilderElement, ElementType } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { elementRegistry } from './ElementRegistry';
import { InlineEditor } from '../components/InlineEditor';
import { InlineRTE, sanitizeHtml } from '../components/InlineRTE';
import { renderElementStyles } from '../utils/styleRenderer';
import { generateResponsiveCSS } from '../utils/responsiveStyles';
import { getIconByName } from '@/components/icons/icon-sources';
import { useEcomPaths } from '@/lib/pathResolver';
import { getEffectiveResponsiveValue } from '../utils/responsiveHelpers';
import { useHeadStyle } from '@/hooks/useHeadStyle';

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

  // Use renderElementStyles with proper responsive inheritance
  const elementStyles = renderElementStyles(element, deviceType);
  
  // Apply defaults only if not already set by responsive styles
  const cleanStyles = {
    textAlign: elementStyles.textAlign || 'center',
    color: elementStyles.color || 'inherit',
    fontSize: elementStyles.fontSize || `${3.5 - level * 0.5}rem`,
    lineHeight: elementStyles.lineHeight || '1.2',
    backgroundColor: elementStyles.backgroundColor || 'transparent',
    ...elementStyles, // Apply all styles from renderElementStyles
  } as React.CSSProperties;

  const shouldApplyMargins = !isEditing;
  const finalStyles = shouldApplyMargins ? cleanStyles : {
    ...cleanStyles,
    marginTop: undefined,
    marginRight: undefined,
    marginBottom: undefined,
    marginLeft: undefined,
  } as React.CSSProperties;

  const className = [`element-${element.id}`, 'outline-none font-bold block rounded'].join(' ');

  return (
    <Tag style={finalStyles} className={className}>
        {isEditing ? (
          <InlineRTE
            value={text}
            onChange={handleTextChange}
            placeholder="Enter heading text..."
            disabled={false}
            variant="heading"
            className="font-inherit leading-tight"
            style={{ textAlign: cleanStyles.textAlign as any }}
          />
        ) : (
          <span className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitizeHtml(text, 'heading') }} />
        )}
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
}> = ({ element, isEditing, onUpdate, deviceType = 'desktop', columnCount = 1 }) => {
  const text = element.content.text || 'Your text content goes here...';

  const handleTextChange = (newText: string) => {
    onUpdate?.({
      content: { ...element.content, text: newText }
    });
  };

  // Use renderElementStyles with proper responsive inheritance
  const elementStyles = renderElementStyles(element, deviceType);
  
  // Apply defaults only if not already set by responsive styles
  const cleanStyles = {
    textAlign: elementStyles.textAlign || (deviceType === 'tablet' ? 'center' : 'left'),
    color: elementStyles.color || 'inherit',
    fontSize: elementStyles.fontSize || '1rem',
    lineHeight: elementStyles.lineHeight || '1.6',
    backgroundColor: elementStyles.backgroundColor || 'transparent',
    ...elementStyles, // Apply all styles from renderElementStyles
  } as React.CSSProperties;

  const shouldApplyMargins = !isEditing;
  const finalStyles = shouldApplyMargins ? cleanStyles : {
    ...cleanStyles,
    marginTop: undefined,
    marginRight: undefined,
    marginBottom: undefined,
    marginLeft: undefined,
  } as React.CSSProperties;

  const className = [`element-${element.id}`, 'outline-none rounded'].join(' ');

  return (
    <div style={finalStyles} className={className}>
        {isEditing ? (
          <InlineRTE
            value={text}
            onChange={handleTextChange}
            placeholder="Enter your text content..."
            disabled={false}
            variant="paragraph"
            className="leading-inherit"
            style={{ textAlign: cleanStyles.textAlign as any }}
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(text, 'paragraph') }} />
        )}
      </div>
  );
};

// Image Element - Fixed alignment implementation
const ImageElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, deviceType = 'desktop', onUpdate }) => {
  
  const { src, alt, caption, alignment = 'center', linkUrl, linkTarget = '_self' } = element.content;
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(false);
  
  const placeholderImage = 'https://fhqwacmokbtbspkxjixf.supabase.co/storage/v1/object/public/images/ae0dc92e-a218-406a-b0b1-b3beecdfe1df/1755657274426-kqm8mnd72w.png';

  // Reset error state when URL changes
  React.useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [src]);

  // Generate responsive CSS for this element
  const responsiveCSS = React.useMemo(() => 
    generateResponsiveCSS(element.id, element.styles), 
    [element.id, element.styles]
  );

  // Get container styles using the shared renderer
  const getContainerStyles = (): React.CSSProperties => {
    const styles = renderElementStyles(element, deviceType);
    const cleanStyles = { ...styles };
    
    // Remove properties that should be applied to the image itself
    delete cleanStyles.width;
    delete cleanStyles.height;
    delete cleanStyles.maxWidth;
    delete cleanStyles.minWidth;
    delete cleanStyles.maxHeight;
    delete cleanStyles.minHeight;
    delete cleanStyles.borderWidth;
    delete cleanStyles.borderColor;
    delete cleanStyles.borderStyle;
    delete cleanStyles.borderRadius;
    
    return cleanStyles;
  };

  // Calculate image styles with alignment and border (width handled by responsive CSS)
  const getImageStyles = (): React.CSSProperties => {
    const baseStyles = {
      height: element.styles?.height || 'auto',
      objectFit: element.styles?.objectFit || 'cover',
      display: 'block'
    } as React.CSSProperties;

    // Apply alignment as margin styles directly to the image
    if (alignment === 'full') {
      baseStyles.width = '100%';
      baseStyles.marginLeft = '0';
      baseStyles.marginRight = '0';
    } else {
      // Apply alignment
      switch (alignment) {
        case 'left':
          baseStyles.marginLeft = '0';
          baseStyles.marginRight = 'auto';
          break;
        case 'right':
          baseStyles.marginLeft = 'auto';
          baseStyles.marginRight = '0';
          break;
        case 'center':
        default:
          baseStyles.marginLeft = 'auto';
          baseStyles.marginRight = 'auto';
          break;
      }
    }

    // Apply border styles directly to the image
    if (element.styles?.borderWidth) {
      baseStyles.borderWidth = element.styles.borderWidth;
      baseStyles.borderStyle = element.styles.borderStyle || 'solid';
      baseStyles.borderColor = element.styles.borderColor || '#e5e7eb';
    }
    
    if (element.styles?.borderRadius) {
      baseStyles.borderRadius = element.styles.borderRadius;
    } else {
      baseStyles.borderRadius = '0.5rem'; // Default rounded-lg
    }

    return baseStyles;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const imageUrl = src || placeholderImage;

  const ImageComponent = () => {
    if (imageError && src) {
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
        {imageLoading && src && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-lg flex items-center justify-center pointer-events-none">
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        )}
        <img
          src={imageUrl}
          alt={alt || (!src ? 'Placeholder image' : '')}
          style={getImageStyles()}
          className={`element-${element.id} select-none`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  };

  const imageContent = linkUrl ? (
    <a 
      href={linkUrl} 
      target={linkTarget}
      className="inline-block select-none"
      onClick={(e) => {
        // In editing mode, prevent navigation but allow selection
        if (isEditing) {
          e.preventDefault();
        }
      }}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      <ImageComponent />
    </a>
  ) : (
    <ImageComponent />
  );

  const containerStylesFinal = (() => { const cs = getContainerStyles(); return !isEditing ? cs : { ...cs, marginTop: undefined, marginRight: undefined, marginBottom: undefined, marginLeft: undefined }; })();

  return (
    <>
      <style>{responsiveCSS}</style>
      <figure 
        className="w-full"
        style={containerStylesFinal}
        onClick={(e) => {
          // Allow event to bubble up for element selection in editing mode
          if (isEditing) {
            // Don't stop propagation to allow ElementWrapper to handle selection
          }
        }}
      >
        {imageContent}
        {caption && (
          <figcaption className="text-sm text-muted-foreground mt-2 text-center">
            {caption}
          </figcaption>
        )}
      </figure>
    </>
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

  const baseStyles = renderElementStyles(element, deviceType);

  // Use responsive helpers for proper inheritance
  const iconSize: number = getEffectiveResponsiveValue(element, 'iconSize', deviceType, 16);
  const itemGap: number = getEffectiveResponsiveValue(element, 'itemGap', deviceType, 4);
  const indent: number = getEffectiveResponsiveValue(element, 'indent', deviceType, 0);
  const iconColor: string | undefined = getEffectiveResponsiveValue(element, 'iconColor', deviceType, undefined);

  // Get text alignment for proper styling
  const textAlign = baseStyles.textAlign || 'left';
  
  const containerStyles: React.CSSProperties = {
    ...baseStyles,
    paddingLeft: indent ? `${indent}px` : baseStyles.paddingLeft,
  };

  const shouldApplyMargins = !isEditing;
  const finalContainerStyles = shouldApplyMargins ? containerStyles : {
    ...containerStyles,
    marginTop: undefined,
    marginRight: undefined,
    marginBottom: undefined,
    marginLeft: undefined,
  };

  let listNode: React.ReactNode;

  if (style === 'numbers') {
    listNode = (
      <ol style={finalContainerStyles} className={`element-${element.id} list-decimal list-inside`}>
        {items.map((item, index) => (
          <li key={index} className="mb-1" style={{ marginBottom: `${itemGap}px` }}>{item.text}</li>
        ))}
      </ol>
    );
  } else if (style === 'icons') {
    // For icon lists, we need to handle alignment differently since items are flex containers
    const getFlexAlignment = (align: string) => {
      switch (align) {
        case 'center': return 'center';
        case 'right': return 'flex-end';
        default: return 'flex-start';
      }
    };

    listNode = (
      <ul style={finalContainerStyles} className={`element-${element.id} list-none pl-0`}>
        {items.map((item, index) => {
          const iconName = item.icon || defaultIcon;
          const IconComponent = getIconByName(iconName) || getIconByName('check');
          return (
            <li 
              key={index} 
              className="mb-1 flex items-start" 
              style={{ 
                marginBottom: `${itemGap}px`,
                justifyContent: getFlexAlignment(textAlign)
              }}
            >
              <span 
                className="mt-0.5" 
                style={{ 
                  lineHeight: 1,
                  marginRight: textAlign === 'right' ? '0' : '8px',
                  marginLeft: textAlign === 'right' ? '8px' : '0'
                }}
              >
                {IconComponent ? <IconComponent 
                  style={{ 
                    width: `${iconSize}px`, 
                    height: `${iconSize}px`, 
                    color: iconColor 
                  }} 
                /> : null}
              </span>
              <span>{item.text}</span>
            </li>
          );
        })}
      </ul>
    );
  } else {
    listNode = (
      <ul style={finalContainerStyles} className={`element-${element.id} list-disc list-inside`}>
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
  const url = element.content.url || '#';
  const target = element.content.target || '_blank';
  const iconName = element.content.icon;
  const IconComponent = iconName ? getIconByName(iconName) : null;

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
        } else {
          // Retry with slight delay for elements that might be loading
          setTimeout(() => {
            const retryEl = tryFind(raw)
              || tryLegacy(raw)
              || (document.querySelector(`[data-pb-section-id="${raw}"]`) as HTMLElement | null)
              || (document.querySelector(`[data-pb-row-id="${raw}"]`) as HTMLElement | null)
              || (document.querySelector(`[data-pb-column-id="${raw}"]`) as HTMLElement | null)
              || (document.querySelector(`[data-pb-element-id="${raw}"]`) as HTMLElement | null);
            
            if (retryEl && 'scrollIntoView' in retryEl) {
              retryEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
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

  // Get responsive alignment with proper cascading fallbacks
  const responsiveStyles = element.styles?.responsive || {};
  const currentDeviceStyles = responsiveStyles[deviceType] || {};
  
  // Proper alignment fallback: current device -> desktop -> base -> default
  let alignment = currentDeviceStyles.textAlign;
  if (!alignment && deviceType === 'tablet') {
    alignment = responsiveStyles.desktop?.textAlign;
  }
  if (!alignment && deviceType === 'mobile') {
    alignment = responsiveStyles.tablet?.textAlign || responsiveStyles.desktop?.textAlign;
  }
  if (!alignment) {
    alignment = element.styles?.textAlign || 'left';
  }
  
  const containerClass = 
    alignment === 'center' ? 'flex justify-center' :
    alignment === 'right' ? 'flex justify-end' : 
    'flex justify-start';

  // Use renderElementStyles for consistent styling
  const elementStyles = renderElementStyles(element, deviceType);
  const shouldApplyMargins = !isEditing;
  const finalStyles = shouldApplyMargins ? elementStyles : {
    ...elementStyles,
    marginTop: undefined,
    marginRight: undefined,
    marginBottom: undefined,
    marginLeft: undefined,
  };
  // Smart padding fallback when no padding is set - ratio-based
  const hasExistingPadding = elementStyles.padding || elementStyles.paddingTop || elementStyles.paddingRight || 
                           elementStyles.paddingBottom || elementStyles.paddingLeft;
  
  if (!hasExistingPadding) {
    const fontSize = String(elementStyles.fontSize || '16px');
    const size = parseInt(fontSize.replace(/\D/g, ''));
    const verticalPadding = Math.max(8, Math.round(size * 0.5)); // 0.5x font size, min 8px
    const horizontalPadding = Math.max(16, Math.round(size * 1.2)); // 1.2x font size, min 16px
    elementStyles.padding = `${verticalPadding}px ${horizontalPadding}px`;
  }

  // Ensure proper line height for large fonts and remove fixed heights
  if (!elementStyles.lineHeight) {
    elementStyles.lineHeight = '1.2';
  }

  // Handle width for full width behavior
  const isFullWidth = elementStyles.width === '100%';
  
  // Generate responsive CSS
  const responsiveCSS = generateResponsiveCSS(element.id, element.styles);
  

  // Check if user has defined any margins
  const hasUserMargins = elementStyles.marginTop || elementStyles.marginRight || 
                         elementStyles.marginBottom || elementStyles.marginLeft || 
                         elementStyles.margin;

  const customClassName = [
    `element-${element.id}`,
    'outline-none cursor-pointer transition-all duration-200',
    isFullWidth ? 'w-full' : '',
    // Only apply m-0 if no user margins are defined
    !hasUserMargins ? 'm-0' : ''
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Inject responsive CSS */}
      {responsiveCSS && <style>{responsiveCSS}</style>}
      
      <div className={containerClass}>
        <button 
          className={`${customClassName} h-auto leading-none inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`}
          onClick={handleClick}
          style={finalStyles}
        >
          {IconComponent && (
            <IconComponent 
              style={{ 
                width: elementStyles.fontSize || '16px',
                height: elementStyles.fontSize || '16px',
                color: 'currentColor'
              }} 
            />
          )}
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
        </button>
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
  // Handle both numeric and string height values for backwards compatibility
  const heightValue = typeof element.content.height === 'number' ? element.content.height : parseInt(String(element.content.height || '50px').replace('px', '')) || 50;
  const height = `${heightValue}px`;

  const handleHeightChange = (newHeight: string) => {
    // Store height as number to match type definition
    const numericHeight = parseInt(newHeight.replace('px', '')) || 50;
    onUpdate?.({
      content: { ...element.content, height: numericHeight }
    });
  };

  const elementStyles = renderElementStyles(element);
  const spacerHeight = String(height);
  const shouldApplyMargins = !isEditing;
  const finalElementStyles = shouldApplyMargins ? elementStyles : {
    ...elementStyles,
    marginTop: undefined,
    marginRight: undefined,
    marginBottom: undefined,
    marginLeft: undefined,
  };
  
  if (isEditing) {
    return (
      <div 
        style={{ 
          ...finalElementStyles, 
          height: finalElementStyles.height || spacerHeight,
          position: 'relative'
        }} 
        className="w-full"
      >
        <div className="absolute inset-0 border border-dashed border-muted-foreground/30 rounded flex items-center justify-center bg-muted/10">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Spacer: {spacerHeight}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ ...finalElementStyles, height: finalElementStyles.height || spacerHeight }} className="w-full" />
  );
};

// Divider Element
const DividerElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, deviceType = 'desktop', onUpdate }) => {
  const style = element.content.style || 'solid';
  const color = element.content.color || '#e5e7eb';
  const width = element.content.width || '100%';
  const thickness = element.content.thickness || 1;
  
  // Get device-specific alignment (fallback: center) - now includes explicit tablet support
  const alignment = element.content.responsive?.[deviceType]?.alignment || 'center';
  
  
  const elementStyles = renderElementStyles(element, deviceType);
  
  // Parse individual margin values from the new spacing system
  const parseMarginValue = (value: string | number | undefined): string => {
    if (!value) return '0px';
    return typeof value === 'number' ? `${value}px` : String(value);
  };
  
  // Get individual margin values
  const marginTop = parseMarginValue(elementStyles.marginTop);
  const marginRight = parseMarginValue(elementStyles.marginRight);
  const marginBottom = parseMarginValue(elementStyles.marginBottom);
  const marginLeft = parseMarginValue(elementStyles.marginLeft);
  const shorthandMargin = elementStyles.margin as string | number | undefined;
  
  // Calculate alignment margins (only when user hasn't set specific left/right margins)
  let dividerMarginLeft = '0';
  let dividerMarginRight = '0';
  
  // Only apply alignment if no explicit left/right margins are set
  const hasExplicitHorizontalMargins = elementStyles.marginLeft !== undefined || elementStyles.marginRight !== undefined;
  
  if (!hasExplicitHorizontalMargins) {
    if (alignment === 'center') {
      dividerMarginLeft = 'auto';
      dividerMarginRight = 'auto';
    } else if (alignment === 'right') {
      dividerMarginLeft = 'auto';
      dividerMarginRight = '0';
    } else {
      dividerMarginLeft = '0';
      dividerMarginRight = 'auto';
    }
  }

  const dividerStyle = {
    border: 'none',
    borderTop: `${thickness}px ${style} ${color}`,
    width,
    margin: 0,
    marginLeft: dividerMarginLeft,
    marginRight: dividerMarginRight,
  } as React.CSSProperties;

  // Remove background styles for the wrapper - dividers should be transparent
  const { backgroundColor, background, ...wrapperStylesWithoutBg } = elementStyles as any;
  
  const shouldApplyMargins = !isEditing;
  const wrapperMargins: React.CSSProperties = shouldApplyMargins
    ? (shorthandMargin !== undefined && !hasExplicitHorizontalMargins
        ? { margin: shorthandMargin as any }
        : { marginTop, marginRight, marginBottom, marginLeft })
    : { margin: undefined, marginTop: undefined, marginRight: undefined, marginBottom: undefined, marginLeft: undefined };
  
  const wrapperStyle: React.CSSProperties = {
    ...wrapperStylesWithoutBg,
    ...wrapperMargins,
    backgroundColor: 'transparent',
    background: 'transparent',
  };

  if (isEditing) {
    return (
      <div className={`element-${element.id} border border-dashed border-muted-foreground/30 rounded p-2 bg-muted/10`} style={wrapperStyle}>
        <hr style={dividerStyle} />
        <div className="text-xs text-muted-foreground text-center mt-2">
          Divider ({alignment})
        </div>
      </div>
    );
  }

  return (
    <div className={`element-${element.id}`} style={wrapperStyle}>
      <hr style={dividerStyle} className="border-none" />
    </div>
  );
};

// Video Element
const VideoElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, deviceType = 'desktop', onUpdate }) => {
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
  
  const containerStyles = renderElementStyles(element, deviceType);
  
  // Strip width-related properties to prevent conflicts with widthByDevice
  const { width: _, maxWidth: __, minWidth: ___, ...cleanContainerStyles } = containerStyles;
  
  const finalContainerStyles = !isEditing ? cleanContainerStyles : {
    ...cleanContainerStyles,
    marginTop: undefined,
    marginRight: undefined,
    marginBottom: undefined,
    marginLeft: undefined,
  };
  
  // Normalize widthByDevice for older content that may not have all device types
  const normalizedWidthByDevice = {
    desktop: width,
    tablet: width,
    mobile: 'full',
    ...widthByDevice
  };
  
  // Get effective width with proper inheritance: mobile -> tablet -> desktop
  const getEffectiveWidth = () => {
    switch (deviceType) {
      case 'mobile':
        return normalizedWidthByDevice.mobile || normalizedWidthByDevice.tablet || normalizedWidthByDevice.desktop;
      case 'tablet':
        return normalizedWidthByDevice.tablet || normalizedWidthByDevice.desktop;
      case 'desktop':
      default:
        return normalizedWidthByDevice.desktop;
    }
  };
  
  const effectiveWidth = getEffectiveWidth();
  // Import video utilities
  const { parseVideoUrl, getVideoWidthClasses, buildEmbedUrl, sanitizeEmbedCode } = React.useMemo(() => {
    return {
      parseVideoUrl: (url: string) => {
        if (!url) return { type: 'unknown' as const };
        
        // YouTube patterns - includes support for Shorts
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
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
        style={finalContainerStyles}
      >
        <p className="text-sm text-muted-foreground">Add a video URL in the properties panel</p>
      </div>
    );
  }

  if (isEditing && videoType === 'embed' && !embedCode) {
    return (
      <div 
        className="w-full h-48 bg-muted flex items-center justify-center border-2 border-dashed border-border rounded-lg"
        style={finalContainerStyles}
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
      <div className={`element-${element.id} ${widthClasses} aspect-video`} style={finalContainerStyles}>
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
        <div className={`element-${element.id} ${widthClasses} aspect-video`} style={finalContainerStyles}>
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
        <div className={`element-${element.id} ${widthClasses} aspect-video`} style={finalContainerStyles}>
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
      className={`element-${element.id} ${widthClasses} aspect-video bg-muted flex items-center justify-center border-2 border-dashed border-border rounded-lg`}
      style={finalContainerStyles}
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
    defaultContent: { text: 'Large Call to Action Headline', level: 2 },
    description: 'Add a title or heading'
  });

  // Paragraph
  elementRegistry.register({
    id: 'text',
    name: 'Text Editor',
    category: 'basic',
    icon: Type,
    component: ParagraphElement,
    defaultContent: { text: 'Your Paragraph text goes Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem dolore, alias, numquam enim ab voluptate id quam harum ducimus cupiditate similique quisquam et deserunt, recusandae. here' },
    description: 'Rich text content'
  });

  // Button
  elementRegistry.register({
    id: 'button',
    name: 'Button',
    category: 'basic',
    icon: RectangleHorizontal,
    component: ButtonElement,
    defaultContent: { text: 'Get Started', variant: 'default', size: 'default', url: '#' },
    description: 'Call to action button'
  });

  // Image
  elementRegistry.register({
    id: 'image',
    name: 'Image',
    category: 'basic',
    icon: Image,
    component: ImageElement,
    defaultContent: { src: '', alt: 'Image', alignment: 'center' },
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
