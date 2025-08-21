/**
 * Converts HTML content to clean plain text by removing all HTML tags,
 * CSS styles, and decoding HTML entities while preserving basic formatting.
 */
export function htmlToPlainText(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Create a temporary DOM element to properly parse and clean HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Extract text content (this automatically strips all HTML tags)
  let text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Additional cleanup for any remaining artifacts
  text = text
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Remove CSS variable references that might leak through
    .replace(/--[a-zA-Z-]*:\s*[^;]*;?/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Truncates plain text to a specified length and adds ellipsis if needed
 */
export function truncatePlainText(text: string, maxLength: number): string {
  const plainText = htmlToPlainText(text);
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength).trim() + '...';
}