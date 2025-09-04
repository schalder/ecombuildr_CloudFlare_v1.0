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

