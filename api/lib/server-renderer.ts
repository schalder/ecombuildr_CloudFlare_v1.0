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
  
  switch (type) {
    case 'heading':
      const headingLevel = content.level || 'h2';
      return `<${headingLevel}${anchorAttr}${styleAttr}>${content.text || ''}</${headingLevel}>`;
      
    case 'text':
      return `<p${anchorAttr}${styleAttr}>${content.text || ''}</p>`;
      
    case 'image':
      const imgSrc = content.src || '';
      const imgAlt = content.alt || '';
      const imgCaption = content.caption ? `<figcaption>${content.caption}</figcaption>` : '';
      const imgElement = `<img src="${imgSrc}" alt="${imgAlt}"${styleAttr} />`;
      
      if (content.alignment === 'center') {
        return `<div${anchorAttr} style="text-align: center;">${imgElement}${imgCaption}</div>`;
      } else if (content.alignment === 'right') {
        return `<div${anchorAttr} style="text-align: right;">${imgElement}${imgCaption}</div>`;
      } else {
        return `<div${anchorAttr}>${imgElement}${imgCaption}</div>`;
      }
      
    case 'button':
      const buttonText = content.text || 'Button';
      const buttonUrl = content.url || '#';
      const buttonTarget = content.target || '_self';
      return `<a href="${buttonUrl}" target="${buttonTarget}"${anchorAttr}${styleAttr}>${buttonText}</a>`;
      
    case 'spacer':
      return `<div${anchorAttr}${styleAttr}></div>`;
      
    case 'divider':
      return `<hr${anchorAttr}${styleAttr} />`;
      
    case 'video':
      const videoSrc = content.src || '';
      const videoCaption = content.caption ? `<figcaption>${content.caption}</figcaption>` : '';
      return `<div${anchorAttr}${styleAttr}><video controls><source src="${videoSrc}" type="video/mp4">Your browser does not support the video tag.</video>${videoCaption}</div>`;
      
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
      return formHTML;
      
    case 'social-links':
      const socialLinks = content.links || [];
      let socialHTML = `<div${anchorAttr}${styleAttr}>`;
      
      socialLinks.forEach((link: any) => {
        socialHTML += `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.platform}</a>`;
      });
      
      socialHTML += '</div>';
      return socialHTML;
      
    default:
      // Fallback for unknown element types
      return `<div${anchorAttr}${styleAttr}>${content.text || ''}</div>`;
  }
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
  
  return `<section${anchorAttr} class="${widthClass}"${styleAttr}>${rowsHTML}</section>`;
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
