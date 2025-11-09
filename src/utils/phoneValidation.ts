// Validate Bangladeshi phone number format (11 digits, starts with 01)
// This matches the server-side validation in create-order edge function
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
  
  if (!isValidBangladeshiPhone(phone)) {
    return 'Invalid phone number format. Please enter a valid 11-digit Bangladeshi mobile number starting with 01.';
  }
  
  return null;
}

