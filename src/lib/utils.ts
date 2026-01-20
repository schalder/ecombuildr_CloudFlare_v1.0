import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatVariant(variation?: any): string {
  if (!variation) return '';
  const source = (variation && typeof variation === 'object' && !Array.isArray(variation) && (variation as any).options)
    ? (variation as any).options
    : variation;
  try {
    if (source && typeof source === 'object' && !Array.isArray(source)) {
      const entries = Object.entries(source).filter(([_, v]) => v !== undefined && v !== null && v !== '');
      if (!entries.length) return '';
      return entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ');
    }
    if (Array.isArray(source)) {
      return source.map(String).join(', ');
    }
    return String(source);
  } catch {
    return '';
  }
}

export function nameWithVariant(name: string, variation?: any): string {
  const v = formatVariant(variation);
  return v ? `${name} — ${v}` : name;
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

export function buildWhatsAppUrl(phoneNumber: string, message?: string): string {
  const sanitizedNumber = phoneNumber.replace(/\D/g, '');
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  if (sanitizedNumber) {
    return `https://wa.me/${sanitizedNumber}?text=${encodedMessage}`;
  }
  
  return `https://wa.me/?text=${encodedMessage}`;
}

export function formatDuration(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0:00:00';
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const seconds = Math.floor((totalMinutes % 1) * 60);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function parseDurationInput(input: string): number {
  if (!input || typeof input !== 'string') return 0;
  
  const parts = input.split(':').map(part => parseInt(part.trim(), 10) || 0);
  
  if (parts.length === 1) {
    // Just minutes
    return parts[0];
  } else if (parts.length === 2) {
    // Minutes:seconds
    return parts[0] + (parts[1] / 60);
  } else if (parts.length === 3) {
    // Hours:minutes:seconds
    return parts[0] * 60 + parts[1] + (parts[2] / 60);
  }
  
  return 0;
}

export function formatDurationForInput(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0:00:00';
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const seconds = Math.floor((totalMinutes % 1) * 60);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function openWhatsApp(phoneNumber: string, message?: string, webOnly = false): void {
  const sanitizedNumber = phoneNumber.replace(/\D/g, '');
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  // Check if we're on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Build the web URL
  const webUrl = sanitizedNumber 
    ? `https://wa.me/${sanitizedNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;
  
  if (!webOnly && isMobile && sanitizedNumber) {
    // Try WhatsApp deep link first on mobile
    const deepLink = `whatsapp://send?phone=${sanitizedNumber}&text=${encodedMessage}`;
    
    // Create hidden link and click it
    const link = document.createElement('a');
    link.href = deepLink;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Try deep link, fallback to web version after timeout
    const timeout = setTimeout(() => {
      openWebWhatsApp(webUrl);
    }, 1000);
    
    // Listen for page visibility change to cancel fallback if app opened
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(timeout);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // Desktop, no phone number, or webOnly - use web version
    openWebWhatsApp(webUrl);
  }
}

function openWebWhatsApp(url: string): void {
  // Try window.open first (most reliable for new tabs)
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      return;
    }
  } catch (error) {
    // Silently continue to fallback
  }
  
  // Fallback to programmatic link click
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    // Last resort: direct navigation
    window.location.href = url;
  }
}

// Utility function to strip HTML tags for plain text display
export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

// Utility function to safely render HTML content
export function createMarkup(html: string) {
  return { __html: html || '' };
}

// Utility function to truncate HTML content while preserving basic formatting
export function truncateHtml(html: string, maxLength: number = 150): string {
  if (!html) return '';
  const stripped = stripHtml(html);
  if (stripped.length <= maxLength) return html;
  return stripped.substring(0, maxLength) + '...';
}

