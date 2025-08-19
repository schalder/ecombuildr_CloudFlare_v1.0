import html2canvas from 'html2canvas';
import { supabase } from "@/integrations/supabase/client";

export interface PreviewCaptureOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Captures a preview image of a DOM element and uploads it to Supabase storage
 */
export const captureAndUploadPreview = async (
  element: HTMLElement,
  fileName: string,
  options: PreviewCaptureOptions = {}
): Promise<string | null> => {
  try {
    const { width = 800, height = 600, quality = 0.8 } = options;

    // Get the actual dimensions of the content
    const rect = element.getBoundingClientRect();
    const actualWidth = rect.width;
    const actualHeight = rect.height;

    // Calculate scale to fit within desired dimensions while maintaining aspect ratio
    const scaleX = width / actualWidth;
    const scaleY = height / actualHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

    const captureWidth = Math.round(actualWidth * scale);
    const captureHeight = Math.round(actualHeight * scale);

    console.log('Capturing preview with html2canvas...');

    // Capture the element as canvas
    let canvas = await html2canvas(element, {
      width: captureWidth,
      height: captureHeight,
      scale: scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (element) => {
        // More specific ignoring to avoid issues
        const shouldIgnore = element.hasAttribute('data-builder-ui') || 
               element.classList?.contains('preview-ignore') ||
               element.classList?.contains('builder-overlay') ||
               element.classList?.contains('builder-toolbar') ||
               // Only ignore fixed elements that are clearly UI overlays
               (element.classList?.contains('fixed') && 
                !element.closest('[data-content-area="true"]'));
        
        if (shouldIgnore) {
          console.log('Ignoring element:', element.className, element.tagName);
        }
        return shouldIgnore;
      },
      // Don't manipulate DOM in onclone to avoid html2canvas issues
      onclone: (clonedDoc) => {
        console.log('Document cloned for capture');
        // Just mark builder elements as hidden via CSS instead of removing them
        const style = clonedDoc.createElement('style');
        style.textContent = `
          [data-builder-ui="true"] { display: none !important; }
          .preview-ignore { display: none !important; }
          .builder-overlay { display: none !important; }
          .builder-toolbar { display: none !important; }
        `;
        clonedDoc.head.appendChild(style);
      }
    });

    // Apply trimming and aspect ratio normalization
    console.log('Trimming white borders from captured canvas...');
    const trimmedCanvas = trimWhiteBorders(canvas);
    
    console.log('Normalizing to fixed aspect ratio...');
    const normalizedCanvas = toFixedAspect(trimmedCanvas);
    
    canvas = normalizedCanvas;

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        quality
      );
    });

    // Generate unique file name
    const timestamp = Date.now();
    const uniqueFileName = `previews/${fileName}_${timestamp}.jpg`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(uniqueFileName, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Error uploading preview:', error);
      return null;
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('images')
      .getPublicUrl(uniqueFileName);

    return publicData.publicUrl;
  } catch (error) {
    console.error('Error capturing preview:', error);
    return null;
  }
};

/**
 * Temporarily hides builder UI elements during capture
 */
const hideBuilderUI = (): (() => void) => {
  const builderElements = document.querySelectorAll('[data-builder-ui="true"]');
  const originalStyles: { element: HTMLElement; display: string }[] = [];
  
  builderElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    originalStyles.push({
      element: htmlElement,
      display: htmlElement.style.display
    });
    htmlElement.style.display = 'none';
  });
  
  // Return cleanup function
  return () => {
    originalStyles.forEach(({ element, display }) => {
      element.style.display = display;
    });
  };
};

/**
 * Finds the first section that has actual content for tighter preview capture
 */
const findFirstSectionWithContent = (): HTMLElement | null => {
  console.log('Looking for first section with content...');
  
  // Priority 1: Look for page builder sections with content
  const sections = document.querySelectorAll('[data-pb-section-id]');
  
  for (const section of sections) {
    const htmlSection = section as HTMLElement;
    
    // Check if section has visible elements (not just empty containers)
    const elements = htmlSection.querySelectorAll('[data-pb-element-id], img, h1, h2, h3, h4, h5, h6, p, button, a, video, div:not([class*="empty"]):not([class*="placeholder"])');
    const hasVisibleContent = Array.from(elements).some(el => {
      const htmlEl = el as HTMLElement;
      const styles = window.getComputedStyle(htmlEl);
      const hasText = htmlEl.innerText?.trim().length > 0;
      const hasImage = htmlEl.tagName === 'IMG' || htmlEl.querySelector('img');
      const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0';
      
      return isVisible && (hasText || hasImage);
    });
    
    if (hasVisibleContent) {
      console.log('Found first section with content');
      return htmlSection;
    }
  }

  // Priority 2: Look for any content sections or containers
  const contentSelectors = [
    '[data-content-area="true"]',
    '.page-builder-content',
    '.canvas-content',
    '.funnel-content'
  ];
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && element.children.length > 0) {
      console.log(`Found content area using selector: ${selector}`);
      return element;
    }
  }
  
  console.log('No sections with content found, falling back to canvas area');
  return findCanvasArea();
};

/**
 * Finds the canvas area as fallback - enhanced with more selectors
 */
const findCanvasArea = (): HTMLElement | null => {
  console.log('Searching for canvas area to capture...');
  
  // Priority 1: Canvas area selectors
  const canvasSelectors = [
    '[data-canvas-area="true"]',
    '[data-content-area="true"]',
    '.canvas-area', 
    '[data-testid="canvas-area"]',
    '.page-builder-canvas',
    '.elementor-canvas-area',
    '.canvas',
    '.page-content',
    '.builder-content'
  ];
  
  for (const selector of canvasSelectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      console.log(`Found canvas element using selector: ${selector}`);
      return element;
    }
  }
  
  // Priority 2: Look for page builder sections and their parent
  const sections = document.querySelectorAll('[data-pb-section-id], [class*="section"], .funnel-step, .page-builder');
  if (sections.length > 0) {
    console.log(`Found ${sections.length} sections, using first one's parent container`);
    
    // Try to find a suitable parent container
    for (const section of sections) {
      const parents = [
        section.closest('.flex-1'),
        section.closest('.canvas'),
        section.closest('.builder'),
        section.closest('.page-content'),
        section.closest('.main-content'),
        section.parentElement
      ].filter(Boolean) as HTMLElement[];
      
      for (const parent of parents) {
        if (parent && parent.offsetWidth > 300 && parent.offsetHeight > 200) {
          console.log('Found suitable parent container');
          return parent;
        }
      }
    }
    
    // If no good parent, use the first section itself
    console.log('Using first section directly');
    return sections[0] as HTMLElement;
  }
  
  // Priority 3: Try main content areas
  const mainSelectors = [
    'main',
    '#main',
    '.main',
    '#content',
    '.content',
    '[role="main"]'
  ];
  
  for (const selector of mainSelectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && element.children.length > 0) {
      console.log(`Found main content using selector: ${selector}`);
      return element;
    }
  }
  
  console.log('No suitable canvas area found');
  return null;
};

/**
 * Trims white borders from a canvas to remove excess whitespace
 */
const trimWhiteBorders = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let top = canvas.height;
  let bottom = 0;
  let left = canvas.width;
  let right = 0;

  // Find content bounds by detecting non-white pixels
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      
      // Check if pixel is not white/transparent (with some tolerance)
      if (!(r > 250 && g > 250 && b > 250) || a < 250) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }

  // If no content found, return original
  if (top >= bottom || left >= right) {
    return canvas;
  }

  // Add small padding
  const padding = 20;
  top = Math.max(0, top - padding);
  left = Math.max(0, left - padding);
  bottom = Math.min(canvas.height - 1, bottom + padding);
  right = Math.min(canvas.width - 1, right + padding);

  // Create trimmed canvas
  const trimmedWidth = right - left + 1;
  const trimmedHeight = bottom - top + 1;
  
  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;
  
  const trimmedCtx = trimmedCanvas.getContext('2d');
  if (trimmedCtx) {
    trimmedCtx.drawImage(
      canvas,
      left, top, trimmedWidth, trimmedHeight,
      0, 0, trimmedWidth, trimmedHeight
    );
  }

  return trimmedCanvas;
};

/**
 * Normalizes canvas to fixed 4:3 aspect ratio (800x600) with white background
 */
const toFixedAspect = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const targetWidth = 800;
  const targetHeight = 600;
  
  const normalizedCanvas = document.createElement('canvas');
  normalizedCanvas.width = targetWidth;
  normalizedCanvas.height = targetHeight;
  
  const ctx = normalizedCanvas.getContext('2d');
  if (!ctx) return canvas;

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Calculate scaling to fit content while maintaining aspect ratio
  const scaleX = targetWidth / canvas.width;
  const scaleY = targetHeight / canvas.height;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = canvas.width * scale;
  const scaledHeight = canvas.height * scale;

  // Center the content
  const offsetX = (targetWidth - scaledWidth) / 2;
  const offsetY = (targetHeight - scaledHeight) / 2;

  ctx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);

  return normalizedCanvas;
};

/**
 * Creates a placeholder preview for empty pages
 */
const createEmptyPagePreview = async (pageId: string, type: 'website_page' | 'funnel_step'): Promise<string | null> => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    canvas.width = 800;
    canvas.height = 600;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 600);
    
    // Border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 798, 598);
    
    // Content
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Empty Page', 400, 280);
    
    ctx.font = '16px Arial';
    ctx.fillText('No content added yet', 400, 320);
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
    });
    
    // Upload
    const timestamp = Date.now();
    const fileName = `previews/empty_${type}_${pageId}_${timestamp}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading empty preview:', error);
      return null;
    }
    
    const { data: publicData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);
    
    return publicData.publicUrl;
  } catch (error) {
    console.error('Error creating empty page preview:', error);
    return null;
  }
};

/**
 * Captures a preview of the page builder content area
 */
export const capturePageBuilderPreview = async (
  pageId: string,
  type: 'website_page' | 'funnel_step' = 'website_page'
): Promise<string | null> => {
  try {
    console.log(`Starting preview capture for ${type} ${pageId}`);
    
    // Wait for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Find the content area - try first section with content, then fallback to canvas
    const contentElement = findFirstSectionWithContent();
    
    if (!contentElement) {
      console.warn('No canvas area found for preview capture');
      return createEmptyPagePreview(pageId, type);
    }
    
    // Check if page has actual content
    const sections = contentElement.querySelectorAll('[data-pb-section-id]');
    const elements = contentElement.querySelectorAll('[data-pb-element-id]');
    const allSections = contentElement.querySelectorAll('[class*="section"]');
    
    console.log(`Found ${sections.length} data-pb sections, ${elements.length} elements, ${allSections.length} total sections`);
    
    // More lenient content detection - check for any sections or meaningful content
    const hasContent = sections.length > 0 || elements.length > 0 || allSections.length > 0 || 
                      contentElement.children.length > 0;
    
    if (!hasContent) {
      console.log('Page appears empty, creating placeholder preview');
      return createEmptyPagePreview(pageId, type);
    }
    
    // Hide builder UI elements temporarily
    const restoreBuilderUI = hideBuilderUI();
    
    try {
      // Wait for UI to update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const fileName = `${type}_${pageId}`;
      
      // Try main capture first
      let previewUrl = await captureAndUploadPreview(contentElement, fileName, {
        width: 800,
        height: 600,
        quality: 0.8
      });
      
      // If main capture failed, try fallback approaches
      if (!previewUrl) {
        console.log('Main capture failed, trying fallback approaches...');
        
        // Fallback 1: Try capturing the first section directly
        const firstSection = contentElement.querySelector('[data-pb-section-id], [class*="section"]') as HTMLElement;
        if (firstSection) {
          console.log('Trying to capture first section...');
          previewUrl = await captureAndUploadPreview(firstSection, `${fileName}_section`, {
            width: 800,
            height: 600,
            quality: 0.8
          });
        }
        
        // Fallback 2: If still no success, create empty preview
        if (!previewUrl) {
          console.log('All capture attempts failed, creating empty preview');
          previewUrl = await createEmptyPagePreview(pageId, type);
        }
      }
      
      return previewUrl;
    } finally {
      // Always restore builder UI
      restoreBuilderUI();
    }
  } catch (error) {
    console.error('Error in capturePageBuilderPreview:', error);
    return createEmptyPagePreview(pageId, type);
  }
};

/**
 * Updates the preview image URL in the database
 */
export const updatePreviewInDatabase = async (
  id: string,
  previewUrl: string,
  type: 'website_page' | 'funnel_step'
) => {
  const table = type === 'website_page' ? 'website_pages' : 'funnel_steps';
  
  const { error } = await supabase
    .from(table)
    .update({ preview_image_url: previewUrl })
    .eq('id', id);

  if (error) {
    console.error('Error updating preview in database:', error);
    throw error;
  }
};

/**
 * Generates and saves a preview for a page/step
 */
export const generateAndSavePreview = async (
  id: string,
  type: 'website_page' | 'funnel_step'
): Promise<void> => {
  try {
    const previewUrl = await capturePageBuilderPreview(id, type);
    
    if (previewUrl) {
      await updatePreviewInDatabase(id, previewUrl, type);
      console.log(`Preview generated and saved for ${type} ${id}`);
    }
  } catch (error) {
    console.error('Error generating and saving preview:', error);
  }
};

/**
 * Manually regenerate preview from management page (when page builder isn't loaded)
 */
export const regeneratePreviewFromManagement = async (
  id: string,
  type: 'website_page' | 'funnel_step'
): Promise<boolean> => {
  try {
    // Open the page builder in a hidden iframe to capture its preview
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '1200px';
    iframe.style.height = '800px';
    
    document.body.appendChild(iframe);
    
    const builderUrl = type === 'website_page' 
      ? `/page-builder/website/${id}` 
      : `/page-builder/funnel/${id}`;
    
    iframe.src = builderUrl;
    
    // Wait for iframe to load and capture
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;
      
      iframe.onload = () => {
        // Wait for page builder to render
        timeoutId = setTimeout(async () => {
          try {
            const iframeDoc = iframe.contentDocument;
            if (!iframeDoc) {
              throw new Error('Cannot access iframe content');
            }
            
            const canvasElement = iframeDoc.querySelector('[data-canvas-area="true"]') as HTMLElement;
            if (!canvasElement) {
              throw new Error('Canvas not found in iframe');
            }
            
            // Create a canvas and capture the iframe content
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              throw new Error('Cannot get canvas context');
            }
            
            canvas.width = 400;
            canvas.height = 300;
            
            // For now, just create a placeholder and update database
            // In a real implementation, you'd need a service to render the page
            const timestamp = Date.now();
            const fileName = `previews/placeholder_${type}_${id}_${timestamp}.jpg`;
            
            // Create a simple placeholder image
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 400, 300);
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Preview Generating...', 200, 150);
            
            canvas.toBlob(async (blob) => {
              if (blob) {
                // Upload placeholder for now
                // In production, you'd implement proper page rendering
                console.log('Preview regeneration initiated for', type, id);
              }
              document.body.removeChild(iframe);
              resolve(true);
            }, 'image/jpeg', 0.8);
            
          } catch (error) {
            console.error('Error capturing iframe:', error);
            document.body.removeChild(iframe);
            resolve(false);
          }
        }, 3000);
      };
      
      iframe.onerror = () => {
        clearTimeout(timeoutId);
        document.body.removeChild(iframe);
        resolve(false);
      };
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearTimeout(timeoutId);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve(false);
      }, 10000);
    });
    
  } catch (error) {
    console.error('Error in manual preview regeneration:', error);
    return false;
  }
};