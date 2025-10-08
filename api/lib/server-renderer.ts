// Server-side PageBuilderRenderer for Edge Function
// Converts JSONB content to HTML strings without React dependencies

export interface ServerPageBuilderData {
  sections: ServerPageBuilderSection[];
  globalStyles?: {
    fontFamily?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  pageStyles?: {
    backgroundType?: 'none' | 'color' | 'image';
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: 'cover' | 'contain' | 'auto';
    backgroundPosition?: string;
    backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
  };
}

export interface ServerPageBuilderSection {
  id: string;
  anchor?: string;
  width: 'full' | 'wide' | 'medium' | 'small';
  customWidth?: string;
  rows: ServerPageBuilderRow[];
  styles?: {
    padding?: string;
    margin?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundImageMode?: 'full-center' | 'parallax' | 'fill-width' | 'no-repeat' | 'repeat';
    backgroundGradient?: string;
    backgroundOpacity?: number;
    boxShadow?: string;
    borderWidth?: string;
    borderColor?: string;
    borderRadius?: string;
    borderStyle?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    width?: string;
    maxWidth?: string;
    minWidth?: string;
    topDivider?: {
      enabled: boolean;
      type: 'smooth-wave' | 'double-wave' | 'mountain-wave' | 'angle-left' | 'angle-right' | 
            'tilted-cut' | 'top-curve' | 'bottom-curve' | 'half-circle' | 'triangle' | 
            'polygon' | 'chevron' | 'clouds' | 'drops' | 'zigzag' | 'dots-line' | 
            'brush-stroke' | 'grunge-tear';
      color?: string;
      height?: number;
      flip?: boolean;
      invert?: boolean;
    };
    bottomDivider?: {
      enabled: boolean;
      type: 'smooth-wave' | 'double-wave' | 'mountain-wave' | 'angle-left' | 'angle-right' | 
            'tilted-cut' | 'top-curve' | 'bottom-curve' | 'half-circle' | 'triangle' | 
            'polygon' | 'chevron' | 'clouds' | 'drops' | 'zigzag' | 'dots-line' | 
            'brush-stroke' | 'grunge-tear';
      color?: string;
      height?: number;
      flip?: boolean;
      invert?: boolean;
    };
  };
}

export interface ServerPageBuilderRow {
  id: string;
  anchor?: string;
  columns: ServerPageBuilderColumn[];
  styles?: {
    padding?: string;
    margin?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundImageMode?: 'full-center' | 'parallax' | 'fill-width' | 'no-repeat' | 'repeat';
    backgroundGradient?: string;
    backgroundOpacity?: number;
    boxShadow?: string;
    borderWidth?: string;
    borderColor?: string;
    borderRadius?: string;
    borderStyle?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    width?: string;
    maxWidth?: string;
    minWidth?: string;
    contentAlignment?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    contentJustification?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
    contentDirection?: 'column' | 'row';
    contentGap?: string;
  };
}

export interface ServerPageBuilderColumn {
  id: string;
  anchor?: string;
  width: number; // 1-12 based on grid system
  customWidth?: string;
  elements: ServerPageBuilderElement[];
  styles?: {
    padding?: string;
    margin?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundImageMode?: 'full-center' | 'parallax' | 'fill-width' | 'no-repeat' | 'repeat';
    backgroundGradient?: string;
    backgroundOpacity?: number;
    boxShadow?: string;
    borderWidth?: string;
    borderColor?: string;
    borderRadius?: string;
    borderStyle?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    width?: string;
    maxWidth?: string;
    minWidth?: string;
    contentAlignment?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    contentJustification?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
    contentDirection?: 'column' | 'row';
    contentGap?: string;
  };
}

export interface ServerPageBuilderElement {
  id: string;
  anchor?: string;
  type: string;
  content: {
    text?: string;
    url?: string;
    alt?: string;
    src?: string;
    width?: number;
    height?: number;
    caption?: string;
    uploadMethod?: 'upload' | 'url';
    alignment?: 'left' | 'right' | 'center' | 'full';
    linkUrl?: string;
    linkTarget?: '_blank' | '_self';
    [key: string]: any;
  };
  styles?: {
    margin?: string;
    padding?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: string;
    lineHeight?: string;
    color?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    boxShadow?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    width?: string;
    height?: string;
    maxWidth?: string;
    minWidth?: string;
    maxHeight?: string;
    minHeight?: string;
    borderWidth?: string;
    borderColor?: string;
    borderRadius?: string;
    borderStyle?: string;
    opacity?: number;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    fontWeight?: string;
    fontFamily?: string;
    [key: string]: any;
  };
}

// Convert styles object to CSS string
function stylesToCSS(styles: any): string {
  if (!styles) return '';
  
  const cssProps: string[] = [];
  
  Object.entries(styles).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      cssProps.push(`${cssKey}: ${value};`);
    }
  });
  
  return cssProps.join(' ');
}

// Render individual element
function renderElement(element: ServerPageBuilderElement): string {
  const { type, content, styles } = element;
  const elementStyles = stylesToCSS(styles);
  const styleAttr = elementStyles ? ` style="${elementStyles}"` : '';
  const anchorAttr = element.anchor ? ` id="${element.anchor}"` : '';
  
  // Generate custom CSS if present
  const customCSS = content?.customCSS;
  const customCSSHTML = customCSS ? `<style>#${element.anchor || element.id} { ${customCSS} }</style>` : '';
  
  // Generate custom JS if present
  const customJS = content?.customJS;
  const customJSHTML = customJS ? `<script>try { ${customJS} } catch(e) { console.error('Custom JS error:', e); }</script>` : '';
  
  let elementHTML = '';
  switch (type) {
    case 'heading':
      const headingLevel = content.level || 'h2';
      elementHTML = `<${headingLevel}${anchorAttr}${styleAttr}>${content.text || ''}</${headingLevel}>`;
      break;
      
    case 'text':
      elementHTML = `<p${anchorAttr}${styleAttr}>${content.text || ''}</p>`;
      break;
      
    case 'image':
      const imgSrc = content.src || '';
      const imgAlt = content.alt || '';
      const imgCaption = content.caption ? `<figcaption>${content.caption}</figcaption>` : '';
      const imgElement = `<img src="${imgSrc}" alt="${imgAlt}"${styleAttr} />`;
      
      if (content.alignment === 'center') {
        elementHTML = `<div${anchorAttr} style="text-align: center;">${imgElement}${imgCaption}</div>`;
      } else if (content.alignment === 'right') {
        elementHTML = `<div${anchorAttr} style="text-align: right;">${imgElement}${imgCaption}</div>`;
      } else {
        elementHTML = `<div${anchorAttr}>${imgElement}${imgCaption}</div>`;
      }
      break;
      
    case 'button':
      const buttonText = content.text || 'Button';
      const buttonUrl = content.url || '#';
      const buttonTarget = content.target || '_self';
      elementHTML = `<a href="${buttonUrl}" target="${buttonTarget}"${anchorAttr}${styleAttr}>${buttonText}</a>`;
      break;
      
    case 'spacer':
      elementHTML = `<div${anchorAttr}${styleAttr}></div>`;
      break;
      
    case 'divider':
      elementHTML = `<hr${anchorAttr}${styleAttr} />`;
      break;
      
    case 'video':
      const videoSrc = content.src || '';
      const videoCaption = content.caption ? `<figcaption>${content.caption}</figcaption>` : '';
      elementHTML = `<div${anchorAttr}${styleAttr}><video controls><source src="${videoSrc}" type="video/mp4">Your browser does not support the video tag.</video>${videoCaption}</div>`;
      break;
      
    case 'form':
      const formAction = content.action || '#';
      const formMethod = content.method || 'POST';
      const formFields = content.fields || [];
      
      let formHTML = `<form action="${formAction}" method="${formMethod}"${anchorAttr}${styleAttr}>`;
      
      formFields.forEach((field: any) => {
        if (field.type === 'text' || field.type === 'email') {
          formHTML += `<input type="${field.type}" name="${field.name}" placeholder="${field.placeholder || ''}" required="${field.required || false}" />`;
        } else if (field.type === 'textarea') {
          formHTML += `<textarea name="${field.name}" placeholder="${field.placeholder || ''}" required="${field.required || false}"></textarea>`;
        } else if (field.type === 'submit') {
          formHTML += `<button type="submit">${field.text || 'Submit'}</button>`;
        }
      });
      
      formHTML += '</form>';
      elementHTML = formHTML;
      break;
      
    case 'social-links':
      const socialLinks = content.links || [];
      let socialHTML = `<div${anchorAttr}${styleAttr}>`;
      
      socialLinks.forEach((link: any) => {
        socialHTML += `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.platform}</a>`;
      });
      
      socialHTML += '</div>';
      elementHTML = socialHTML;
      break;
      
    default:
      // Fallback for unknown element types
      elementHTML = `<div${anchorAttr}${styleAttr}>${content.text || ''}</div>`;
  }
  
  // Return element with custom CSS and JS
  return customCSSHTML + elementHTML + customJSHTML;
}

// Render column
function renderColumn(column: ServerPageBuilderColumn): string {
  const columnStyles = stylesToCSS(column.styles);
  const styleAttr = columnStyles ? ` style="${columnStyles}"` : '';
  const anchorAttr = column.anchor ? ` id="${column.anchor}"` : '';
  
  // Calculate column width based on grid system
  const colWidth = column.customWidth || `${(column.width / 12) * 100}%`;
  const widthStyle = `width: ${colWidth};`;
  
  const elementsHTML = column.elements.map(element => renderElement(element)).join('');
  
  return `<div${anchorAttr} style="${widthStyle}${columnStyles ? ' ' + columnStyles : ''}">${elementsHTML}</div>`;
}

// Render row
function renderRow(row: ServerPageBuilderRow): string {
  const rowStyles = stylesToCSS(row.styles);
  const styleAttr = rowStyles ? ` style="${rowStyles}"` : '';
  const anchorAttr = row.anchor ? ` id="${row.anchor}"` : '';
  
  const columnsHTML = row.columns.map(column => renderColumn(column)).join('');
  
  return `<div${anchorAttr} class="row"${styleAttr}>${columnsHTML}</div>`;
}

// Render divider as HTML
function renderDivider(divider: any, position: 'top' | 'bottom'): string {
  if (!divider?.enabled) return '';
  
  const { type, color = '#ffffff', height = 100, flip = false, invert = false } = divider;
  
  // SVG paths for each divider type
  const dividerPaths: Record<string, string> = {
    'smooth-wave': '<path d="M0,60 C300,120 600,0 900,60 C1050,90 1200,30 1200,60 L1200,120 L0,120 Z" />',
    'double-wave': '<path d="M0,60 C200,20 400,100 600,60 C800,20 1000,100 1200,60 L1200,120 L0,120 Z" /><path d="M0,80 C200,40 400,120 600,80 C800,40 1000,120 1200,80 L1200,120 L0,120 Z" opacity="0.7" />',
    'mountain-wave': '<path d="M0,60 L200,20 L400,80 L600,10 L800,90 L1000,30 L1200,60 L1200,120 L0,120 Z" />',
    'angle-left': '<path d="M0,0 L1200,120 L1200,0 Z" />',
    'angle-right': '<path d="M0,120 L1200,0 L1200,120 Z" />',
    'tilted-cut': '<path d="M0,40 L1200,80 L1200,120 L0,120 Z" />',
    'top-curve': '<path d="M0,60 C300,0 600,0 900,60 C1050,90 1200,30 1200,60 L1200,120 L0,120 Z" />',
    'bottom-curve': '<path d="M0,0 L1200,0 L1200,60 C1050,30 900,90 600,60 C300,0 0,0 0,60 Z" />',
    'half-circle': '<path d="M0,60 C0,26.9 26.9,0 60,0 L1140,0 C1173.1,0 1200,26.9 1200,60 L1200,120 L0,120 Z" />',
    'triangle': '<path d="M0,0 L600,120 L1200,0 Z" />',
    'polygon': '<path d="M0,60 L200,20 L400,80 L600,10 L800,90 L1000,30 L1200,60 L1200,120 L0,120 Z" />',
    'chevron': '<path d="M0,60 L200,0 L400,60 L600,0 L800,60 L1000,0 L1200,60 L1200,120 L0,120 Z" />',
    'clouds': '<path d="M0,60 C50,40 100,80 150,60 C200,40 250,80 300,60 C350,40 400,80 450,60 C500,40 550,80 600,60 C650,40 700,80 750,60 C800,40 850,80 900,60 C950,40 1000,80 1050,60 C1100,40 1150,80 1200,60 L1200,120 L0,120 Z" />',
    'drops': '<path d="M0,60 C100,20 200,100 300,60 C400,20 500,100 600,60 C700,20 800,100 900,60 C1000,20 1100,100 1200,60 L1200,120 L0,120 Z" />',
    'zigzag': '<path d="M0,60 L100,20 L200,80 L300,40 L400,100 L500,60 L600,20 L700,80 L800,40 L900,100 L1000,60 L1100,20 L1200,80 L1200,120 L0,120 Z" />',
    'dots-line': '<circle cx="100" cy="60" r="8" /><circle cx="300" cy="60" r="8" /><circle cx="500" cy="60" r="8" /><circle cx="700" cy="60" r="8" /><circle cx="900" cy="60" r="8" /><circle cx="1100" cy="60" r="8" /><rect x="0" y="60" width="1200" height="60" />',
    'brush-stroke': '<path d="M0,60 C150,30 300,90 450,50 C600,10 750,70 900,40 C1050,10 1200,50 1200,60 L1200,120 L0,120 Z" />',
    'grunge-tear': '<path d="M0,60 L50,40 L100,80 L150,20 L200,90 L250,30 L300,70 L350,10 L400,85 L450,25 L500,75 L550,15 L600,80 L650,35 L700,90 L750,45 L800,70 L850,20 L900,85 L950,40 L1000,75 L1050,25 L1100,80 L1150,30 L1200,60 L1200,120 L0,120 Z" />'
  };
  
  const path = dividerPaths[type] || dividerPaths['smooth-wave'];
  const transform = `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`.trim();
  
  const svgStyle = `width: 100%; height: ${height}px; ${transform ? `transform: ${transform};` : ''} fill: ${color};`;
  const containerStyle = `position: absolute; ${position}: 0; left: 0; right: 0; width: 100%; height: ${height}px; z-index: 1; pointer-events: none;`;
  
  return `<div style="${containerStyle}"><svg viewBox="0 0 1200 120" preserveAspectRatio="none" style="${svgStyle}">${path}</svg></div>`;
}

// Render section
function renderSection(section: ServerPageBuilderSection): string {
  const sectionStyles = stylesToCSS(section.styles);
  const styleAttr = sectionStyles ? ` style="${sectionStyles}"` : '';
  const anchorAttr = section.anchor ? ` id="${section.anchor}"` : '';
  
  // Calculate section width
  let widthClass = '';
  if (section.customWidth) {
    widthClass = '';
  } else {
    switch (section.width) {
      case 'full':
        widthClass = 'w-full';
        break;
      case 'wide':
        widthClass = 'max-w-4xl mx-auto px-4';
        break;
      case 'medium':
        widthClass = 'max-w-2xl mx-auto px-4';
        break;
      case 'small':
        widthClass = 'max-w-lg mx-auto px-4';
        break;
    }
  }
  
  const rowsHTML = section.rows.map(row => renderRow(row)).join('');
  
  // Render dividers
  const topDividerHTML = section.styles?.topDivider ? renderDivider(section.styles.topDivider, 'top') : '';
  const bottomDividerHTML = section.styles?.bottomDivider ? renderDivider(section.styles.bottomDivider, 'bottom') : '';
  
  return `<section${anchorAttr} class="${widthClass}"${styleAttr}>${topDividerHTML}${rowsHTML}${bottomDividerHTML}</section>`;
}

// Main function to render page builder data to HTML
export function renderPageBuilderToHTML(data: ServerPageBuilderData): string {
  if (!data || !data.sections || data.sections.length === 0) {
    return '<div class="text-center py-12"><p class="text-muted-foreground">This page is still being set up.</p></div>';
  }
  
  // Generate page styles
  const pageStyles = data.pageStyles ? stylesToCSS(data.pageStyles) : '';
  const globalStyles = data.globalStyles ? stylesToCSS(data.globalStyles) : '';
  
  // Render all sections
  const sectionsHTML = data.sections.map(section => renderSection(section)).join('');
  
  // Generate CSS for responsive design
  const responsiveCSS = `
    <style>
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      @media (max-width: 768px) {
        .row {
          flex-direction: column;
        }
        .row > div {
          width: 100% !important;
        }
      }
      
      ${globalStyles ? `.page-builder-content { ${globalStyles} }` : ''}
    </style>
  `;
  
  return `
    ${responsiveCSS}
    <div class="page-builder-content"${pageStyles ? ` style="${pageStyles}"` : ''}>
      ${sectionsHTML}
    </div>
  `;
}

// Convert client-side PageBuilderData to server-side format
export function convertToServerFormat(data: any): ServerPageBuilderData {
  return {
    sections: data.sections?.map((section: any) => ({
      id: section.id,
      anchor: section.anchor,
      width: section.width,
      customWidth: section.customWidth,
      styles: section.styles,
      rows: section.rows?.map((row: any) => ({
        id: row.id,
        anchor: row.anchor,
        columns: row.columns?.map((column: any) => ({
          id: column.id,
          anchor: column.anchor,
          width: column.width,
          customWidth: column.customWidth,
          elements: column.elements?.map((element: any) => ({
            id: element.id,
            anchor: element.anchor,
            type: element.type,
            content: element.content,
            styles: element.styles
          })) || []
        })) || []
      })) || []
    })) || [],
    globalStyles: data.globalStyles,
    pageStyles: data.pageStyles
  };
}
