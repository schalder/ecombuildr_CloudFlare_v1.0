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

export function openWhatsApp(phoneNumber: string, message?: string): void {
  const sanitizedNumber = phoneNumber.replace(/\D/g, '');
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  // Check if we're on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile && sanitizedNumber) {
    // Try WhatsApp deep link first on mobile
    const deepLink = `whatsapp://send?phone=${sanitizedNumber}&text=${encodedMessage}`;
    
    // Create hidden link and click it
    const link = document.createElement('a');
    link.href = deepLink;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Try deep link, fallback to web version after timeout
    const timeout = setTimeout(() => {
      const webUrl = sanitizedNumber 
        ? `https://wa.me/${sanitizedNumber}?text=${encodedMessage}`
        : `https://wa.me/?text=${encodedMessage}`;
      
      const webLink = document.createElement('a');
      webLink.href = webUrl;
      webLink.target = '_blank';
      webLink.rel = 'noopener noreferrer';
      document.body.appendChild(webLink);
      webLink.click();
      document.body.removeChild(webLink);
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
    // Desktop or no phone number - use web version
    const webUrl = sanitizedNumber 
      ? `https://wa.me/${sanitizedNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    // Use programmatic link click to ensure new tab
    const link = document.createElement('a');
    link.href = webUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

