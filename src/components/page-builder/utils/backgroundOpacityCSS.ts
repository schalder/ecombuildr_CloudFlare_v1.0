import { PageBuilderSection, PageBuilderRow, PageBuilderColumn } from '../types';
import { generateBackgroundImageOpacityCSS } from './backgroundOpacity';

/**
 * Generates CSS for background images with opacity using pseudo-elements
 */
export function generateBackgroundOpacityCSS(sections: PageBuilderSection[]): string {
  let css = '';
  
  sections.forEach(section => {
    // Section background image opacity
    if (section.styles?.backgroundImage && 
        section.styles?.backgroundOpacity !== undefined && 
        section.styles.backgroundOpacity < 1) {
      css += generateBackgroundImageOpacityCSS(
        `section-${section.id}`, 
        section.styles.backgroundImage, 
        section.styles.backgroundOpacity
      );
    }
    
    // Row background image opacity
    section.rows.forEach(row => {
      if (row.styles?.backgroundImage && 
          row.styles?.backgroundOpacity !== undefined && 
          row.styles.backgroundOpacity < 1) {
        css += generateBackgroundImageOpacityCSS(
          `row-${row.id}`, 
          row.styles.backgroundImage, 
          row.styles.backgroundOpacity
        );
      }
      
      // Column background image opacity
      row.columns.forEach(column => {
        if (column.styles?.backgroundImage && 
            column.styles?.backgroundOpacity !== undefined && 
            column.styles.backgroundOpacity < 1) {
          css += generateBackgroundImageOpacityCSS(
            `column-${column.id}`, 
            column.styles.backgroundImage, 
            column.styles.backgroundOpacity
          );
        }
      });
    });
  });
  
  return css;
}