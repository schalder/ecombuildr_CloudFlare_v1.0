import React, { useState } from 'react';
import { Type, Heading1, Heading2, Heading3, Image, List, RectangleHorizontal, Minus, Play } from 'lucide-react';
import { PageBuilderElement, ElementType } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { elementRegistry } from './ElementRegistry';
import { InlineEditor } from '../components/InlineEditor';
import { InlineRTE, sanitizeHtml } from '../components/InlineRTE';
import { renderElementStyles, getDeviceAwareSpacing } from '../utils/styleRenderer';
import { generateResponsiveCSS } from '../utils/responsiveStyles';
import { getIconByName } from '@/components/icons/icon-sources';
import { useEcomPaths } from '@/lib/pathResolver';
import { getEffectiveResponsiveValue } from '../utils/responsiveHelpers';
import { useHeadStyle } from '@/hooks/useHeadStyle';
import { StorefrontImage } from '@/components/storefront/renderer/StorefrontImage';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { useStoreProducts } from '@/hooks/useStoreData';
import { useResolvedWebsiteId } from '@/hooks/useResolvedWebsiteId';
import { useStore } from '@/contexts/StoreContext';
import { useWebsiteContext } from '@/contexts/WebsiteContext';
import { useFunnelStepContext } from '@/contexts/FunnelStepContext';
import { supabase } from '@/integrations/supabase/client';

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
  // Note: lineHeight fallback should only apply if truly undefined (not empty string or null)
  const cleanStyles = {
    textAlign: elementStyles.textAlign || 'center',
    color: elementStyles.color || 'inherit',
    fontSize: elementStyles.fontSize || `${3.5 - level * 0.5}rem`,
    backgroundColor: elementStyles.backgroundColor || 'transparent',
    ...elementStyles, // Apply all styles from renderElementStyles (includes responsive lineHeight)
  } as React.CSSProperties;
  
  // Apply lineHeight fallback only if it's not set after the spread
  if (!cleanStyles.lineHeight || cleanStyles.lineHeight === '') {
    cleanStyles.lineHeight = '1.2';
  }

  const className = [`element-${element.id}`, 'outline-none font-bold block rounded'].join(' ');

  // Inject responsive CSS into document head
  useHeadStyle(`element-responsive-${element.id}`, generateResponsiveCSS(element.id, element.styles));

  return (
    <Tag style={cleanStyles} className={className}>
        {isEditing ? (
          <InlineRTE
            value={text}
            onChange={handleTextChange}
            placeholder="Enter heading text..."
            disabled={false}
            variant="heading"
            className="font-inherit"
            style={{ 
              textAlign: cleanStyles.textAlign as any,
              lineHeight: cleanStyles.lineHeight,
              fontSize: cleanStyles.fontSize,
              color: cleanStyles.color,
              fontFamily: cleanStyles.fontFamily,
              fontWeight: cleanStyles.fontWeight
            }}
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

  const className = [`element-${element.id}`, 'outline-none rounded'].join(' ');

  // Inject responsive CSS into document head
  useHeadStyle(`element-responsive-${element.id}`, generateResponsiveCSS(element.id, element.styles));

  return (
    <div style={cleanStyles} className={className}>
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
  // Exclude border properties, width, and maxWidth from responsive CSS
  // These are applied directly to the image via inline styles to work together with alignment
  const responsiveCSS = React.useMemo(() => {
    // Filter out border properties, width, and maxWidth from styles
    // These are applied directly to the image via inline styles
    const filteredStyles = {
      ...element.styles,
    };
    
    // Remove border properties from base styles (they're applied via inline styles)
    delete filteredStyles.borderWidth;
    delete filteredStyles.borderColor;
    delete filteredStyles.borderStyle;
    delete filteredStyles.borderRadius;
    // Remove width and maxWidth from base styles (applied via inline styles)
    delete filteredStyles.width;
    delete filteredStyles.maxWidth;
    
    // Process responsive styles if they exist
    if (element.styles?.responsive) {
      filteredStyles.responsive = {
        desktop: { ...element.styles.responsive.desktop },
        tablet: { ...element.styles.responsive.tablet },
        mobile: { ...element.styles.responsive.mobile }
      };
      
      // Remove border properties, width, and maxWidth from responsive styles for each device
      ['desktop', 'tablet', 'mobile'].forEach(device => {
        if (filteredStyles.responsive[device]) {
          delete filteredStyles.responsive[device].borderWidth;
          delete filteredStyles.responsive[device].borderColor;
          delete filteredStyles.responsive[device].borderStyle;
          delete filteredStyles.responsive[device].borderRadius;
          // Exclude width and maxWidth from responsive CSS - applied via inline styles
          delete filteredStyles.responsive[device].width;
          delete filteredStyles.responsive[device].maxWidth;
        }
      });
    }
    
    return generateResponsiveCSS(element.id, filteredStyles);
  }, [element.id, element.styles]);

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

  // Calculate image styles with alignment, width, maxWidth, and border
  const getImageStyles = (): React.CSSProperties => {
    // Get responsive styles with proper inheritance
    const responsiveStyles = element.styles?.responsive || {};
    const currentDeviceStyles = responsiveStyles[deviceType] || {};
    
    // Get width with responsive fallback (mobile -> tablet -> desktop -> base)
    let width = currentDeviceStyles.width;
    if (width === undefined || width === null || width === '') {
      if (deviceType === 'mobile') {
        width = responsiveStyles.tablet?.width || responsiveStyles.desktop?.width || element.styles?.width;
      } else if (deviceType === 'tablet') {
        width = responsiveStyles.desktop?.width || element.styles?.width;
      } else {
        width = element.styles?.width;
      }
    }
    
    // Get maxWidth (not responsive, just base - default to 100% if not set)
    const maxWidth = element.styles?.maxWidth || '100%';

    const baseStyles = {
      height: element.styles?.height || 'auto',
      objectFit: element.styles?.objectFit || 'cover',
      display: 'block',
      // ADD: Prevent layout shift with aspect ratio
      aspectRatio: element.styles?.aspectRatio || (element.styles?.width && element.styles?.height 
        ? `${element.styles.width} / ${element.styles.height}` 
        : undefined)
    } as React.CSSProperties;

    // Apply width and maxWidth to the image element
    // Width and alignment work together - width sets size, alignment sets position
    if (alignment === 'full') {
      baseStyles.width = '100%';
      baseStyles.marginLeft = '0';
      baseStyles.marginRight = '0';
    } else {
      // Apply width if set (presets like 50%, 75%, etc. or custom values)
      if (width) {
        baseStyles.width = width;
      }
      // Always apply maxWidth (default 100% if not set, user can customize)
      baseStyles.maxWidth = maxWidth;
      
      // ✅ Remove alignment margins from image - alignment is now handled by wrapper
      // The image should just fill its container (the wrapper)
      baseStyles.marginLeft = '0';
      baseStyles.marginRight = '0';
    }

    // Apply border styles directly to the image
    // Check responsive styles first, then fall back to base styles
    // Note: responsiveStyles and currentDeviceStyles are already declared above for width checking
    
    // Get border values with responsive fallback (mobile -> tablet -> desktop -> base)
    // Check if borderWidth exists (not undefined/null/empty) for current device
    const hasCurrentBorder = currentDeviceStyles.borderWidth !== undefined && 
                             currentDeviceStyles.borderWidth !== null && 
                             currentDeviceStyles.borderWidth !== '';
    
    let borderWidth = hasCurrentBorder ? currentDeviceStyles.borderWidth : undefined;
    let borderColor = hasCurrentBorder ? currentDeviceStyles.borderColor : undefined;
    let borderStyle = hasCurrentBorder ? currentDeviceStyles.borderStyle : undefined;
    let borderRadius = currentDeviceStyles.borderRadius !== undefined ? currentDeviceStyles.borderRadius : undefined;
    
    // Fallback inheritance for mobile/tablet
    if (!hasCurrentBorder) {
      if (deviceType === 'mobile') {
        // Mobile: try tablet, then desktop, then base
        borderWidth = responsiveStyles.tablet?.borderWidth || responsiveStyles.desktop?.borderWidth || element.styles?.borderWidth;
        borderColor = responsiveStyles.tablet?.borderColor || responsiveStyles.desktop?.borderColor || element.styles?.borderColor;
        borderStyle = responsiveStyles.tablet?.borderStyle || responsiveStyles.desktop?.borderStyle || element.styles?.borderStyle;
        borderRadius = responsiveStyles.tablet?.borderRadius || responsiveStyles.desktop?.borderRadius || element.styles?.borderRadius;
      } else if (deviceType === 'tablet') {
        // Tablet: try desktop, then base
        borderWidth = responsiveStyles.desktop?.borderWidth || element.styles?.borderWidth;
        borderColor = responsiveStyles.desktop?.borderColor || element.styles?.borderColor;
        borderStyle = responsiveStyles.desktop?.borderStyle || element.styles?.borderStyle;
        borderRadius = responsiveStyles.desktop?.borderRadius || element.styles?.borderRadius;
    } else {
        // Desktop: use base styles
        borderWidth = element.styles?.borderWidth;
        borderColor = element.styles?.borderColor;
        borderStyle = element.styles?.borderStyle;
        borderRadius = element.styles?.borderRadius;
      }
    }
    
    // Handle borderRadius separately as it can be set independently
    if (borderRadius === undefined) {
      borderRadius = element.styles?.borderRadius;
    }
    
    // Apply border styles if borderWidth is set
    if (borderWidth) {
      baseStyles.borderWidth = borderWidth;
      baseStyles.borderStyle = borderStyle || 'solid';
      baseStyles.borderColor = borderColor || '#e5e7eb';
    }
    
    // Apply border radius (can be set independently)
    if (borderRadius) {
      baseStyles.borderRadius = borderRadius;
    } else if (!borderWidth) {
      // Only apply default borderRadius if no border is set
      baseStyles.borderRadius = '0.5rem'; // Default rounded-lg
    }

    // ✅ ADD: Apply opacity with responsive fallback
    let opacity = currentDeviceStyles.opacity !== undefined ? currentDeviceStyles.opacity : undefined;
    if (opacity === undefined) {
      if (deviceType === 'mobile') {
        opacity = responsiveStyles.tablet?.opacity !== undefined 
          ? responsiveStyles.tablet.opacity 
          : responsiveStyles.desktop?.opacity !== undefined 
            ? responsiveStyles.desktop.opacity 
            : element.styles?.opacity;
      } else if (deviceType === 'tablet') {
        opacity = responsiveStyles.desktop?.opacity !== undefined 
          ? responsiveStyles.desktop.opacity 
          : element.styles?.opacity;
      } else {
        opacity = element.styles?.opacity;
      }
    }
    if (opacity !== undefined) {
      baseStyles.opacity = typeof opacity === 'string' ? parseFloat(opacity) : opacity;
    }

    // ✅ NOTE: boxShadow is handled separately in getWrapperStyles() for proper rendering
    return baseStyles;
  };

  // ✅ Get wrapper styles (for box shadow) - shadow needs to be on wrapper div, not img tag
  const getWrapperStyles = (): React.CSSProperties => {
    const responsiveStyles = element.styles?.responsive || {};
    const currentDeviceStyles = responsiveStyles[deviceType] || {};
    
    let boxShadow = currentDeviceStyles.boxShadow !== undefined ? currentDeviceStyles.boxShadow : undefined;
    if (boxShadow === undefined) {
      if (deviceType === 'mobile') {
        boxShadow = responsiveStyles.tablet?.boxShadow !== undefined 
          ? responsiveStyles.tablet.boxShadow 
          : responsiveStyles.desktop?.boxShadow !== undefined 
            ? responsiveStyles.desktop.boxShadow 
            : element.styles?.boxShadow;
      } else if (deviceType === 'tablet') {
        boxShadow = responsiveStyles.desktop?.boxShadow !== undefined 
          ? responsiveStyles.desktop.boxShadow 
          : element.styles?.boxShadow;
      } else {
        boxShadow = element.styles?.boxShadow;
      }
    }
    
    const wrapperStyles: React.CSSProperties = {};
    
    // ✅ Apply box shadow if it exists and is not 'none'
    if (boxShadow && boxShadow !== 'none') {
      wrapperStyles.boxShadow = boxShadow;
    }
    
    // ✅ Apply alignment to wrapper div itself (not the image)
    if (alignment === 'full') {
      wrapperStyles.width = '100%';
      wrapperStyles.display = 'block';
    } else {
      // For non-full alignments, use block display and apply alignment margins to wrapper
      wrapperStyles.display = 'block';
      
      switch (alignment) {
        case 'left':
          wrapperStyles.marginLeft = '0';
          wrapperStyles.marginRight = 'auto';
          wrapperStyles.width = 'fit-content';
          break;
        case 'right':
          wrapperStyles.marginLeft = 'auto';
          wrapperStyles.marginRight = '0';
          wrapperStyles.width = 'fit-content';
          break;
        case 'center':
        default:
          wrapperStyles.marginLeft = 'auto';
          wrapperStyles.marginRight = 'auto';
          wrapperStyles.width = 'fit-content';
          break;
      }
    }
    
    return wrapperStyles;
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

    // Determine if image is above fold (first section, first 2 rows)
    const isCritical = element.metadata?.position === 'above-fold' || 
                       element.metadata?.sectionIndex === 0;
    
    // Use optimized component for live pages
    if (!isEditing) {
      // Helper to check if a value is a pixel value (not percentage)
      const isPixelValue = (value: string | undefined): boolean => {
        if (!value) return false;
        // Check if it ends with 'px' or is a pure number (for pixel values)
        return value.endsWith('px') || (!value.includes('%') && !value.includes('vw') && !value.includes('vh') && !isNaN(parseFloat(value)));
      };
      
      // Get the actual width value that will be applied (with responsive fallback)
      const getActualWidth = (): string | undefined => {
        const responsiveStyles = element.styles?.responsive || {};
        const currentDeviceStyles = responsiveStyles[deviceType] || {};
        
        let width = currentDeviceStyles.width;
        if (width === undefined || width === null || width === '') {
          if (deviceType === 'mobile') {
            width = responsiveStyles.tablet?.width || responsiveStyles.desktop?.width || element.styles?.width;
          } else if (deviceType === 'tablet') {
            width = responsiveStyles.desktop?.width || element.styles?.width;
          } else {
            width = element.styles?.width;
          }
        }
        return width;
      };
      
      // Only pass numeric width/height if they're pixel values
      // Percentage widths are handled via inline styles, not numeric props
      const getNumericWidth = (): number | undefined => {
        const width = getActualWidth();
        if (!width) return undefined;
        if (typeof width === 'string' && isPixelValue(width)) {
          const num = parseInt(width.replace('px', ''));
          return isNaN(num) ? undefined : num;
        }
        return undefined;
      };
      
      const getNumericHeight = (): number | undefined => {
        const height = element.styles?.height;
        if (!height) return undefined;
        if (typeof height === 'string' && isPixelValue(height)) {
          const num = parseInt(height.replace('px', ''));
          return isNaN(num) ? undefined : num;
        }
        return undefined;
      };
      
      // ✅ Wrap StorefrontImage in div for box shadow
      const wrapperStyle = getWrapperStyles();
      
      return (
        <div style={wrapperStyle}>
          <StorefrontImage
            src={imageUrl}
            alt={alt || (!src ? 'Placeholder image' : '')}
            className={`element-${element.id}`}
            style={getImageStyles()}
            priority={isCritical}
            isCritical={isCritical}
            width={getNumericWidth()}
            height={getNumericHeight()}
            aspectRatio={element.styles?.aspectRatio}
            preserveOriginal={true}
          />
        </div>
      );
    }
    
    // ✅ Editor mode - wrap image in div for box shadow
    const wrapperStyle = getWrapperStyles();
    
    return (
      <div className="relative" style={wrapperStyle}>
        {imageLoading && src && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-lg flex items-center justify-center pointer-events-none z-10">
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

  return (
    <>
      <style>{responsiveCSS}</style>
      <figure 
        className="w-full"
        style={getContainerStyles()}
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
    // For icon lists, we need to handle alignment differently since items are flex containers
    const getFlexAlignment = (align: string) => {
      switch (align) {
        case 'center': return 'center';
        case 'right': return 'flex-end';
        default: return 'flex-start';
      }
    };

    listNode = (
      <ul style={containerStyles} className={`element-${element.id} list-none pl-0`}>
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
  const url = element.content.url || '#';
  const target = element.content.target || '_blank';
  const iconName = element.content.icon;
  const IconComponent = iconName ? getIconByName(iconName) : null;
  
  // Subtext properties
  const subtext = element.content.subtext || '';
  const subtextPosition = element.content.subtextPosition || 'below'; // 'below' or 'above'

  const linkType: 'page' | 'url' | 'scroll' | undefined = element.content.linkType || (element.content.url ? 'url' : undefined);
  const pageSlug: string | undefined = element.content.pageSlug;
  const scrollTarget: string | undefined = element.content.scrollTarget;
  const paths = useEcomPaths();

  // Pixel tracking setup
  const { pixels } = usePixelContext();
  const { store } = useStore();
  const { websiteId } = useWebsiteContext();
  const { funnelId } = useFunnelStepContext();
  const resolvedWebsiteId = useResolvedWebsiteId(element);
  
  // ✅ FIX: Ensure storeId is available - fetch from website/funnel if store not loaded
  const [effectiveStoreId, setEffectiveStoreId] = React.useState<string | undefined>(store?.id);
  
  React.useEffect(() => {
    if (store?.id) {
      setEffectiveStoreId(store.id);
    } else if (resolvedWebsiteId) {
      // Fetch storeId from website
      supabase.from('websites').select('store_id').eq('id', resolvedWebsiteId).maybeSingle()
        .then(({ data }) => {
          if (data?.store_id) {
            setEffectiveStoreId(data.store_id);
          }
        })
        .catch((error) => {
          console.warn('[ButtonElement] Failed to fetch storeId from website:', error);
        });
    } else if (funnelId) {
      // Fetch storeId from funnel
      supabase.from('funnels').select('store_id').eq('id', funnelId).maybeSingle()
        .then(({ data }) => {
          if (data?.store_id) {
            setEffectiveStoreId(data.store_id);
          }
        })
        .catch((error) => {
          console.warn('[ButtonElement] Failed to fetch storeId from funnel:', error);
        });
    }
  }, [store?.id, resolvedWebsiteId, funnelId]);
  
  const { trackAddToCart } = usePixelTracking(pixels, effectiveStoreId, resolvedWebsiteId, funnelId);
  const productIds = element.content.addToCartProductIds || [];
  const { products } = useStoreProducts({ 
    specificProductIds: productIds.length > 0 ? productIds : undefined,
    websiteId: resolvedWebsiteId 
  });

  const computedUrl = React.useMemo(() => {
    if (linkType === 'page') {
      return pageSlug ? `${paths.base}/${pageSlug}` : paths.home;
    }
    if (linkType === 'url' || !linkType) {
      return url;
    }
    return '#';
  }, [linkType, pageSlug, paths.base, paths.home, url]);

  const handleClick = (e: React.MouseEvent) => {
    // Fire AddToCart pixel events if enabled (tracking only, no cart manipulation)
    if (element.content.enableAddToCart && !isEditing && productIds.length > 0 && trackAddToCart && products.length > 0) {
      products.forEach((product) => {
        if (productIds.includes(product.id)) {
          trackAddToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            category: product.category_id || undefined,
          });
        }
      });
    }
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
        e.stopPropagation();
        window.open(finalUrl, '_blank');
      } else {
        // In editor mode, prevent default action but allow event to bubble up to ElementRenderer
        // so it can open the properties panel
        e.preventDefault();
        // Don't call stopPropagation() so ElementRenderer can handle the click
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
    alignment === 'center' ? 'flex justify-center w-full overflow-hidden' :
    alignment === 'right' ? 'flex justify-end w-full overflow-hidden' : 
    'flex justify-start w-full overflow-hidden';

  // Use renderElementStyles for consistent styling
  const elementStyles = renderElementStyles(element, deviceType);

  // Get device-aware subtext styles
  const subtextFontSize = getEffectiveResponsiveValue(element, 'subtextFontSize', deviceType, '12px');
  const subtextColor = getEffectiveResponsiveValue(element, 'subtextColor', deviceType, elementStyles.color || '#ffffff');
  const subtextFontWeight = getEffectiveResponsiveValue(element, 'subtextFontWeight', deviceType, '400');
  const subtextFontFamily = getEffectiveResponsiveValue(element, 'subtextFontFamily', deviceType, 'inherit');

  // Smart padding fallback when no padding is set - ratio-based
  const hasExistingPadding = elementStyles.padding || elementStyles.paddingTop || elementStyles.paddingRight || 
                           elementStyles.paddingBottom || elementStyles.paddingLeft;
  
  if (!hasExistingPadding) {
    const fontSize = String(elementStyles.fontSize || '16px');
    const size = parseInt(fontSize.replace(/\D/g, ''));
    // Increase vertical padding slightly if subtext exists
    const verticalPadding = element.content.subtext 
      ? Math.max(10, Math.round(size * 0.6)) 
      : Math.max(8, Math.round(size * 0.5));
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
  

  // NOTE: Margins are now handled by ElementRenderer wrapper
  // This check should always be false now due to our central fix in styleRenderer.ts
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
          className={`${customClassName} h-auto leading-none inline-flex ${subtextPosition === 'above' ? 'flex-col-reverse' : 'flex-col'} items-center justify-center gap-1 whitespace-normal rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`}
          onClick={handleClick}
          style={elementStyles}
        >
          {/* Main content wrapper for icon + text */}
          <div className="flex items-center justify-center gap-2 whitespace-normal text-center">
            {IconComponent && element.content.iconPosition !== 'after' && (
              <IconComponent 
                style={{ 
                  width: getEffectiveResponsiveValue(element, 'iconSize', deviceType, elementStyles.fontSize || '16px'),
                  height: getEffectiveResponsiveValue(element, 'iconSize', deviceType, elementStyles.fontSize || '16px'),
                  color: getEffectiveResponsiveValue(element, 'iconColor', deviceType, 'currentColor')
                }} 
              />
            )}
            <span className="break-words">{text}</span>
            {IconComponent && element.content.iconPosition === 'after' && (
              <IconComponent 
                style={{ 
                  width: getEffectiveResponsiveValue(element, 'iconSize', deviceType, elementStyles.fontSize || '16px'),
                  height: getEffectiveResponsiveValue(element, 'iconSize', deviceType, elementStyles.fontSize || '16px'),
                  color: getEffectiveResponsiveValue(element, 'iconColor', deviceType, 'currentColor')
                }} 
              />
            )}
          </div>
          
          {/* Subtext - only shown if exists */}
          {subtext && (
            <span 
              style={{
                fontSize: subtextFontSize,
                color: subtextColor,
                fontWeight: subtextFontWeight,
                fontFamily: subtextFontFamily,
                lineHeight: '1.2'
              }}
              className="whitespace-normal text-center"
            >
              {subtext}
            </span>
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
}> = ({ element, isEditing, deviceType = 'desktop', onUpdate }) => {
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

  const elementStyles = renderElementStyles(element, deviceType);
  const spacerHeight = String(height);
  
  if (isEditing) {
    return (
      <div 
        style={{ 
          ...elementStyles, 
          height: elementStyles.height || spacerHeight,
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
    <div style={{ ...elementStyles, height: elementStyles.height || spacerHeight }} className="w-full" />
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
  
  // NOTE: Margins are now handled by ElementRenderer wrapper
  // ElementStyles should not contain margins due to our central fix in styleRenderer.ts
  // The parseMarginValue logic is kept for backward compatibility but should receive undefined values
  
  // Calculate alignment margins for divider positioning
  let dividerMarginLeft = '0';
  let dividerMarginRight = '0';
  
  // Apply alignment-based margins (margins from ElementRenderer wrapper are separate)
  
  // Apply alignment regardless of margins (since margins are handled by wrapper)
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

  const dividerStyle = {
    border: 'none',
    borderTop: `${thickness}px ${style} ${color}`,
    width,
    margin: 0,
    marginLeft: dividerMarginLeft,
    marginRight: dividerMarginRight,
  };

  // Remove background styles for the wrapper - dividers should be transparent
  const { backgroundColor, background, ...wrapperStylesWithoutBg } = elementStyles;
  
  const wrapperStyle = {
    ...wrapperStylesWithoutBg,
    // NOTE: Margins removed - handled by ElementRenderer wrapper to prevent double application
    backgroundColor: 'transparent',
    background: 'transparent',
  };

  if (isEditing) {
    return (
      <div className="border border-dashed border-muted-foreground/30 rounded p-2 bg-muted/10" style={wrapperStyle}>
        <hr style={dividerStyle} />
        <div className="text-xs text-muted-foreground text-center mt-2">
          Divider ({alignment})
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
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
  
  // Extract padding to apply directly to video container
  // Get device-aware padding values
  const paddingByDevice = (element.styles as any)?.paddingByDevice;
  const deviceAwarePadding = paddingByDevice ? getDeviceAwareSpacing(paddingByDevice, deviceType) : null;
  
  // Build padding styles object
  const videoPaddingStyles: React.CSSProperties = {};
  if (deviceAwarePadding) {
    if (deviceAwarePadding.top > 0) videoPaddingStyles.paddingTop = `${deviceAwarePadding.top}px`;
    if (deviceAwarePadding.right > 0) videoPaddingStyles.paddingRight = `${deviceAwarePadding.right}px`;
    if (deviceAwarePadding.bottom > 0) videoPaddingStyles.paddingBottom = `${deviceAwarePadding.bottom}px`;
    if (deviceAwarePadding.left > 0) videoPaddingStyles.paddingLeft = `${deviceAwarePadding.left}px`;
  } else {
    // Fallback to legacy padding from containerStyles
    if (containerStyles.paddingTop) videoPaddingStyles.paddingTop = containerStyles.paddingTop;
    if (containerStyles.paddingRight) videoPaddingStyles.paddingRight = containerStyles.paddingRight;
    if (containerStyles.paddingBottom) videoPaddingStyles.paddingBottom = containerStyles.paddingBottom;
    if (containerStyles.paddingLeft) videoPaddingStyles.paddingLeft = containerStyles.paddingLeft;
    if (containerStyles.padding && !containerStyles.paddingTop && !containerStyles.paddingRight && 
        !containerStyles.paddingBottom && !containerStyles.paddingLeft) {
      videoPaddingStyles.padding = containerStyles.padding;
    }
  }
  
  // Strip width-related properties and padding from containerStyles
  // Padding is now applied directly to video container
  const { 
    width: _, 
    maxWidth: __, 
    minWidth: ___, 
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    padding,
    ...cleanContainerStyles 
  } = containerStyles;
  
  // Normalize widthByDevice with proper fallbacks for each device independently
  const normalizedWidthByDevice = React.useMemo(() => {
    const existingWidthByDevice = widthByDevice || {};
    return {
      desktop: existingWidthByDevice.desktop || width || 'full',
      tablet: existingWidthByDevice.tablet || 'full', // Default for tablet
      mobile: existingWidthByDevice.mobile || 'full'  // Default for mobile
    };
  }, [widthByDevice, width]);
  
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
        style={cleanContainerStyles}
      >
        <p className="text-sm text-muted-foreground">Add a video URL in the properties panel</p>
      </div>
    );
  }

  if (isEditing && videoType === 'embed' && !embedCode) {
    return (
      <div 
        className="w-full h-48 bg-muted flex items-center justify-center border-2 border-dashed border-border rounded-lg"
        style={cleanContainerStyles}
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
      <div className={`${widthClasses} aspect-video`} style={{ ...cleanContainerStyles, ...videoPaddingStyles }}>
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
        <div className={`${widthClasses} aspect-video`} style={{ ...cleanContainerStyles, ...videoPaddingStyles }}>
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
        <div className={`${widthClasses} aspect-video`} style={{ ...cleanContainerStyles, ...videoPaddingStyles }}>
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
      style={cleanContainerStyles}
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
    name: 'Paragraph',
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
    defaultContent: { 
      text: 'Get Started', 
      variant: 'default', 
      size: 'default', 
      url: '#',
      subtext: '',
      subtextPosition: 'below',
      subtextFontSize: '12px',
      subtextFontWeight: '400',
      iconPosition: 'before'
    },
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
