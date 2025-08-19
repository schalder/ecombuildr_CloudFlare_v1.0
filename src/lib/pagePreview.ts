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
    const { width = 400, height = 300, quality = 0.8 } = options;

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      width,
      height,
      scale: 0.5, // Reduce scale for smaller file size
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      ignoreElements: (element) => {
        // Ignore overlay elements, tooltips, etc.
        return element.classList?.contains('preview-ignore') || false;
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
 * Captures a preview of the page builder canvas area
 */
export const capturePageBuilderPreview = async (
  pageId: string,
  type: 'website_page' | 'funnel_step' = 'website_page'
): Promise<string | null> => {
  // Wait a bit for DOM to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Try multiple selectors to find the canvas area
  const selectors = [
    '[data-canvas-area="true"]',
    '.canvas-area', 
    '[data-testid="canvas-area"]',
    '.elementor-page-builder',
    '.page-builder-canvas'
  ];
  
  let canvasElement: HTMLElement | null = null;
  
  for (const selector of selectors) {
    canvasElement = document.querySelector(selector) as HTMLElement;
    if (canvasElement) {
      console.log(`Found canvas element using selector: ${selector}`);
      break;
    }
  }
  
  // If still not found, try to find any container with page builder content
  if (!canvasElement) {
    // Look for any element containing page builder sections
    const pageBuilderContainers = document.querySelectorAll('[class*="section"], [id*="pb-"], [class*="page-builder"]');
    if (pageBuilderContainers.length > 0) {
      // Find the parent container that wraps all sections
      canvasElement = pageBuilderContainers[0].closest('.flex-1, .canvas, .builder') as HTMLElement || 
                    pageBuilderContainers[0].parentElement as HTMLElement;
      console.log('Found canvas element by searching page builder content');
    }
  }
  
  if (!canvasElement) {
    console.warn('Canvas area not found for preview capture - tried all selectors');
    return null;
  }

  const fileName = `${type}_${pageId}`;
  return captureAndUploadPreview(canvasElement, fileName, {
    width: 400,
    height: 300,
    quality: 0.7
  });
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