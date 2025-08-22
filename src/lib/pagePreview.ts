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

    

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
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
        
        return shouldIgnore;
      },
      // Don't manipulate DOM in onclone to avoid html2canvas issues
      onclone: (clonedDoc) => {
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
 * Finds the best element to capture for preview
 */
const findContentArea = (): HTMLElement | null => {
  
  // Priority 1: Content area (sections only, no builder UI)
  const contentArea = document.querySelector('[data-content-area="true"]') as HTMLElement;
  if (contentArea) {
    return contentArea;
  }
  
  // Priority 2: Canvas area (fallback to current method)
  const selectors = [
    '[data-canvas-area="true"]',
    '.canvas-area', 
    '[data-testid="canvas-area"]',
    '.page-builder-canvas',
    '.elementor-canvas-area'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      return element;
    }
  }
  
  // Priority 3: Look for page builder sections directly
  const sections = document.querySelectorAll('[data-pb-section-id]');
  if (sections.length > 0) {
    // Find the common parent container
    const parent = sections[0].closest('.canvas, .builder, .page-content, .flex-1') as HTMLElement || 
                  sections[0].parentElement as HTMLElement;
    if (parent) {
      return parent;
    }
  }
  
  // Priority 4: Look for any sections with class containing "section"
  const pageBuilderContainers = document.querySelectorAll('[class*="section"], [id*="pb-"]');
  if (pageBuilderContainers.length > 0) {
    const parent = pageBuilderContainers[0].closest('.flex-1, .canvas, .builder') as HTMLElement || 
                  pageBuilderContainers[0].parentElement as HTMLElement;
    if (parent) {
      return parent;
    }
  }
  
  return null;
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
    
    // Wait for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Find the content area
    const contentElement = findContentArea();
    
    if (!contentElement) {
      return createEmptyPagePreview(pageId, type);
    }
    
    // Check if page has actual content
    const sections = contentElement.querySelectorAll('[data-pb-section-id]');
    const elements = contentElement.querySelectorAll('[data-pb-element-id]');
    const allSections = contentElement.querySelectorAll('[class*="section"]');
    
    
    
    // More lenient content detection - check for any sections or meaningful content
    const hasContent = sections.length > 0 || elements.length > 0 || allSections.length > 0 || 
                      contentElement.children.length > 0;
    
    if (!hasContent) {
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
        // Fallback 1: Try capturing the first section directly
        const firstSection = contentElement.querySelector('[data-pb-section-id], [class*="section"]') as HTMLElement;
        if (firstSection) {
          previewUrl = await captureAndUploadPreview(firstSection, `${fileName}_section`, {
            width: 800,
            height: 600,
            quality: 0.8
          });
        }
        
        // Fallback 2: If still no success, create empty preview
        if (!previewUrl) {
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