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

export function openWhatsApp(phoneNumber: string, message?: string, webOnly = false): void {
  const sanitizedNumber = phoneNumber.replace(/\D/g, '');
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  console.log('Opening WhatsApp:', { phoneNumber: sanitizedNumber, message, webOnly });
  
  // Check if we're on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Build the web URL
  const webUrl = sanitizedNumber 
    ? `https://wa.me/${sanitizedNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;
  
  console.log('WhatsApp URL:', webUrl);
  
  if (!webOnly && isMobile && sanitizedNumber) {
    // Try WhatsApp deep link first on mobile
    const deepLink = `whatsapp://send?phone=${sanitizedNumber}&text=${encodedMessage}`;
    console.log('Trying mobile deep link:', deepLink);
    
    // Create hidden link and click it
    const link = document.createElement('a');
    link.href = deepLink;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Try deep link, fallback to web version after timeout
    const timeout = setTimeout(() => {
      console.log('Deep link timeout, falling back to web URL');
      openWebWhatsApp(webUrl);
    }, 1000);
    
    // Listen for page visibility change to cancel fallback if app opened
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden, deep link likely worked');
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
    console.log('Using web version');
    openWebWhatsApp(webUrl);
  }
}

function openWebWhatsApp(url: string): void {
  // Try window.open first (most reliable for new tabs)
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      console.log('Opened with window.open');
      return;
    }
  } catch (error) {
    console.log('window.open failed:', error);
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
    console.log('Opened with programmatic link click');
  } catch (error) {
    console.log('Programmatic link failed:', error);
    
    // Last resort: direct navigation
    window.location.href = url;
    console.log('Used direct navigation as last resort');
  }
}

