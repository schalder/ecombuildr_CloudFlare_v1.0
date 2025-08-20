import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

export interface PreviewGenerationOptions {
  width?: number;
  height?: number;
  scale?: number;
  quality?: number;
}

/**
 * Captures a preview from an existing PageBuilderRenderer element in the DOM
 * This approach works by capturing the visible renderer, similar to admin template builder
 */
export const generatePagePreviewFromDOM = async (
  containerId: string,
  id: string,
  type: 'website_page' | 'funnel_step',
  options: PreviewGenerationOptions = {}
): Promise<string | null> => {
  const {
    width = 1200,
    height = 675,
    scale = 2,
    quality = 1.0
  } = options;

  try {
    console.log(`Generating preview from DOM for ${type} ${id}`);
    
    // Find the preview element
    const previewElement = document.getElementById(containerId);
    if (!previewElement) {
      console.warn('Preview element not found:', containerId);
      return null;
    }

    // Wait for images and fonts to load
    await waitForAssetsToLoad(previewElement);
    
    // Additional delay to ensure full rendering
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Capture with html2canvas
    const canvas = await html2canvas(previewElement, {
      width,
      height,
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      removeContainer: true,
      logging: false
    });
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png', quality);
    });
    
    // Upload to Supabase storage
    const publicUrl = await uploadPreviewToStorage(blob, id, type);
    
    return publicUrl;
    
  } catch (error) {
    console.error('Error generating preview from DOM:', error);
    return null;
  }
};

/**
 * Waits for all images and fonts in the container to load
 */
const waitForAssetsToLoad = async (container: HTMLElement): Promise<void> => {
  // Wait for images to load
  const images = container.querySelectorAll('img');
  const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve; // Continue even if image fails to load
      setTimeout(resolve, 3000); // Timeout after 3 seconds
    });
  });

  await Promise.all(imagePromises);

  // Wait for fonts to render
  await new Promise(resolve => setTimeout(resolve, 500));
};

/**
 * Uploads the preview image to Supabase storage
 */
const uploadPreviewToStorage = async (
  imageBlob: Blob,
  id: string,
  type: 'website_page' | 'funnel_step'
): Promise<string | null> => {
  try {
    const timestamp = Date.now();
    const fileName = `previews/${type}_${id}_${timestamp}.png`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Failed to upload preview to storage:', error);
    return null;
  }
};

/**
 * Updates the preview image URL in the database
 */
export const updatePreviewInDatabase = async (
  id: string,
  previewUrl: string,
  type: 'website_page' | 'funnel_step'
): Promise<void> => {
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
 * Generates and saves a preview for a page/step using DOM-based approach
 */
export const generateAndSavePagePreviewFromDOM = async (
  containerId: string,
  id: string,
  type: 'website_page' | 'funnel_step'
): Promise<void> => {
  try {
    console.log(`Starting DOM preview generation for ${type} ${id}`);
    
    // Generate preview from existing DOM element
    const previewUrl = await generatePagePreviewFromDOM(containerId, id, type);
    
    if (previewUrl) {
      await updatePreviewInDatabase(id, previewUrl, type);
      console.log(`Preview generated and saved for ${type} ${id}`);
    } else {
      console.warn(`Failed to generate preview for ${type} ${id}`);
      // Fallback to empty page preview
      const emptyPreviewUrl = await createEmptyPagePreview(id, type);
      if (emptyPreviewUrl) {
        await updatePreviewInDatabase(id, emptyPreviewUrl, type);
      }
    }
  } catch (error) {
    console.error('Error generating and saving preview:', error);
  }
};

/**
 * Creates a placeholder preview for empty pages
 */
const createEmptyPagePreview = async (
  pageId: string,
  type: 'website_page' | 'funnel_step'
): Promise<string | null> => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    canvas.width = 1200;
    canvas.height = 675;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 675);
    
    // Border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 1198, 673);
    
    // Content
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Empty Page', 600, 320);
    
    ctx.font = '20px Arial';
    ctx.fillText('No content added yet', 600, 360);
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
    });
    
    // Upload
    const previewUrl = await uploadPreviewToStorage(blob, pageId, type);
    return previewUrl;
  } catch (error) {
    console.error('Error creating empty page preview:', error);
    return null;
  }
};