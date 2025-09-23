import { supabase } from '@/integrations/supabase/client';

// Common email domain typos and their corrections
export const emailDomainCorrections: Record<string, string> = {
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaail.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahooo.co.uk': 'yahoo.co.uk',
  'hotmial.com': 'hotmail.com',
  'hotmailcom': 'hotmail.com',
  'hotmial.co.uk': 'hotmail.co.uk',
  'outlok.com': 'outlook.com',
  'outlok.co.uk': 'outlook.co.uk',
  'live.com': 'live.com',
  'msn.com': 'msn.com',
  'aol.com': 'aol.com',
  'comcast.net': 'comcast.net',
  'icloud.com': 'icloud.com'
};

export interface EmailValidationResult {
  isValid: boolean;
  suggestedCorrection?: string;
  originalEmail: string;
  correctedEmail?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  type: 'email' | 'phone' | null;
  message: string;
  action: 'LOGIN' | 'USE_DIFFERENT_PHONE' | 'USE_DIFFERENT_EMAIL' | null;
}

export interface ValidationResult {
  isValid: boolean;
  emailValidation?: EmailValidationResult;
  duplicateCheck?: DuplicateCheckResult;
  errors: string[];
}

// Validate email and suggest corrections for typos
export function validateEmailWithTypoDetection(email: string): EmailValidationResult {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return {
      isValid: false,
      originalEmail: email
    };
  }

  const [localPart, domain] = normalizedEmail.split('@');
  
  // Check if domain needs correction
  if (emailDomainCorrections[domain]) {
    const suggestedCorrection = emailDomainCorrections[domain];
    const correctedEmail = `${localPart}@${suggestedCorrection}`;
    
    return {
      isValid: true,
      originalEmail: email,
      suggestedCorrection,
      correctedEmail
    };
  }

  return {
    isValid: true,
    originalEmail: email
  };
}

// Normalize phone number for consistent storage and comparison
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Handle Bangladesh country code variations
  if (normalized.startsWith('880')) {
    // Already has country code
    return '+' + normalized;
  } else if (normalized.startsWith('0')) {
    // Remove leading 0 and add Bangladesh country code
    return '+880' + normalized.substring(1);
  } else if (normalized.length === 11 && !normalized.startsWith('+')) {
    // Assume it's a Bangladesh number without leading 0
    return '+880' + normalized;
  } else if (normalized.length === 10 && !normalized.startsWith('+')) {
    // Assume it's a Bangladesh number without country code and leading 0
    return '+880' + normalized;
  }
  
  // Add + if missing but has country code
  if (!normalized.startsWith('+') && normalized.length > 10) {
    return '+' + normalized;
  }
  
  return normalized;
}

// Check if email already exists in the system
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking email existence:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in checkEmailExists:', error);
    return false;
  }
}

// Check if phone number already exists in the system
export async function checkPhoneExists(phone: string): Promise<boolean> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Query all profiles and check normalized phone numbers client-side
    const { data, error } = await supabase
      .from('profiles')
      .select('phone')
      .not('phone', 'is', null);

    if (error) {
      console.error('Error checking phone existence:', error);
      return false;
    }

    // Check if any existing phone matches when normalized
    return data?.some(profile => 
      profile.phone && normalizePhoneNumber(profile.phone) === normalizedPhone
    ) || false;
  } catch (error) {
    console.error('Error in checkPhoneExists:', error);
    return false;
  }
}

// Comprehensive validation before signup
export async function validateSignupData(
  email: string, 
  phone: string, 
  password: string, 
  confirmPassword: string,
  fullName: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  let emailValidation: EmailValidationResult | undefined;
  let duplicateCheck: DuplicateCheckResult | undefined;

  // Basic field validation
  if (!email || !phone || !password || !confirmPassword || !fullName) {
    errors.push('Please fill in all fields.');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  // Email validation with typo detection
  if (email) {
    emailValidation = validateEmailWithTypoDetection(email);
    if (!emailValidation.isValid) {
      errors.push('Please enter a valid email address.');
    }
  }

  // Check for duplicates only if basic validation passes
  if (errors.length === 0 && email && phone) {
    const [emailExists, phoneExists] = await Promise.all([
      checkEmailExists(email),
      checkPhoneExists(phone)
    ]);

    if (emailExists) {
      duplicateCheck = {
        isDuplicate: true,
        type: 'email',
        message: 'An account with this email already exists. Please sign in instead.',
        action: 'LOGIN'
      };
    } else if (phoneExists) {
      duplicateCheck = {
        isDuplicate: true,
        type: 'phone',
        message: 'This phone number is already registered with another account. Please use a different phone number.',
        action: 'USE_DIFFERENT_PHONE'
      };
    } else {
      duplicateCheck = {
        isDuplicate: false,
        type: null,
        message: '',
        action: null
      };
    }
  }

  return {
    isValid: errors.length === 0 && !duplicateCheck?.isDuplicate,
    emailValidation,
    duplicateCheck,
    errors
  };
}