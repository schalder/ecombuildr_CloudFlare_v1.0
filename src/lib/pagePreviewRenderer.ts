import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { PageBuilderData } from '@/components/page-builder/types';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import React from 'react';
import { createRoot } from 'react-dom/client';

export interface PreviewGenerationOptions {
  width?: number;
  height?: number;
  scale?: number;
  quality?: number;
}

/**
 * Creates a hidden off-screen container and renders the PageBuilderRenderer
 * to capture an accurate preview image
 */
export const generatePagePreviewImage = async (
  pageData: PageBuilderData,
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

  let previewContainer: HTMLDivElement | null = null;
  
  try {
    console.log(`Generating hidden preview for ${type} ${id}`);
    
    // Create hidden preview container
    previewContainer = document.createElement('div');
    previewContainer.id = `page-preview-hidden-${id}`;
    previewContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${width}px;
      min-height: ${height}px;
      background: white;
      overflow: hidden;
      z-index: -1;
    `;
    
    document.body.appendChild(previewContainer);
    
    // Create React root and render PageBuilderRenderer
    const root = createRoot(previewContainer);
    
    await new Promise<void>((resolve, reject) => {
      try {
        root.render(
          React.createElement(PageBuilderRenderer, {
            data: pageData,
            className: 'preview-render'
          })
        );
        
        // Wait for rendering to complete
        setTimeout(resolve, 1000);
      } catch (error) {
        reject(error);
      }
    });
    
    // Wait for images and fonts to load
    await waitForAssetsToLoad(previewContainer);
    
    // Additional delay to ensure full rendering
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Capture with html2canvas
    const canvas = await html2canvas(previewContainer, {
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
    
    // Cleanup
    root.unmount();
    
    return publicUrl;
    
  } catch (error) {
    console.error('Error generating hidden preview:', error);
    return null;
  } finally {
    // Always cleanup
    if (previewContainer && document.body.contains(previewContainer)) {
      document.body.removeChild(previewContainer);
    }
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
 * Generates and saves a preview for a page/step using hidden renderer
 */
export const generateAndSavePagePreview = async (
  pageData: PageBuilderData,
  id: string,
  type: 'website_page' | 'funnel_step'
): Promise<void> => {
  try {
    console.log(`Starting preview generation for ${type} ${id}`);
    
    // Check if pageData has content
    if (!pageData.sections || pageData.sections.length === 0) {
      console.log('No content found, creating empty page preview');
      const emptyPreviewUrl = await createEmptyPagePreview(id, type);
      if (emptyPreviewUrl) {
        await updatePreviewInDatabase(id, emptyPreviewUrl, type);
      }
      return;
    }
    
    // Generate preview using hidden renderer
    const previewUrl = await generatePagePreviewImage(pageData, id, type);
    
    if (previewUrl) {
      await updatePreviewInDatabase(id, previewUrl, type);
      console.log(`Preview generated and saved for ${type} ${id}`);
    } else {
      console.warn(`Failed to generate preview for ${type} ${id}`);
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