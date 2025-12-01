// Validate international phone number format
// Supports formats like: +1234567890, +1-234-567-8900, +44 20 1234 5678, etc.
export function isValidInternationalPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove spaces, dashes, parentheses, and dots (keep + and digits)
  const cleaned = phone.replace(/[\s\-().]/g, '');
  
  // International phone number regex:
  // - Must start with + followed by country code (1-3 digits)
  // - Then 4-14 more digits (total 7-15 digits after +)
  // OR
  // - Can be 7-15 digits without + (for backward compatibility with local formats)
  const internationalRegex = /^(\+[1-9]\d{6,14}|\d{7,15})$/;
  
  return internationalRegex.test(cleaned);
}

// Legacy function for backward compatibility (deprecated, use isValidInternationalPhone)
export function isValidBangladeshiPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove any spaces, dashes, or plus signs
  const cleaned = phone.replace(/[\s\-+]/g, '');
  
  // Check if it's exactly 11 digits and starts with 01
  const phoneRegex = /^01[0-9]{9}$/;
  return phoneRegex.test(cleaned);
}

// Get validation error message
export function getPhoneValidationError(phone: string): string | null {
  if (!phone || phone.trim() === '') {
    return null; // Empty phone is handled by required field validation
  }
  
  if (!isValidInternationalPhone(phone)) {
    return 'Invalid phone number format. Please enter a valid international phone number (e.g., +1234567890, +44 20 1234 5678).';
  }
  
  return null;
}

