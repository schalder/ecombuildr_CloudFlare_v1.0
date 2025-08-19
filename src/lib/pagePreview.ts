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
  // Find the canvas area element
  const canvasElement = document.querySelector('[data-canvas-area="true"]') as HTMLElement;
  
  if (!canvasElement) {
    console.warn('Canvas area not found for preview capture');
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