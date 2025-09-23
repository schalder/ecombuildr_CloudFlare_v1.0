import { supabase } from '@/integrations/supabase/client';

// Common email domain typos and their corrections
const emailDomainCorrections: Record<string, string> = {
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmial.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
};

// Normalize phone number for Bangladesh format
export const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Handle different Bangladesh phone formats
  if (digitsOnly.startsWith('88') && digitsOnly.length === 13) {
    // +8801XXXXXXXXX format
    return digitsOnly;
  } else if (digitsOnly.startsWith('01') && digitsOnly.length === 11) {
    // 01XXXXXXXXX format
    return `88${digitsOnly}`;
  } else if (digitsOnly.startsWith('1') && digitsOnly.length === 10) {
    // 1XXXXXXXXX format (missing leading 0)
    return `880${digitsOnly}`;
  }
  
  return digitsOnly;
};

// Check for email domain typos and suggest corrections
export const checkEmailTypo = (email: string): { hasTypo: boolean; suggestion?: string } => {
  if (!email.includes('@')) return { hasTypo: false };
  
  const [localPart, domain] = email.split('@');
  const lowerDomain = domain.toLowerCase();
  
  if (emailDomainCorrections[lowerDomain]) {
    return {
      hasTypo: true,
      suggestion: `${localPart}@${emailDomainCorrections[lowerDomain]}`
    };
  }
  
  return { hasTypo: false };
};

// Check if user already exists by email
export const checkUserExistsByEmail = async (email: string): Promise<{ exists: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking user by email:', error);
      return { exists: false, error: 'Failed to check email availability' };
    }

    return { exists: !!data };
  } catch (error) {
    console.error('Error checking user by email:', error);
    return { exists: false, error: 'Failed to check email availability' };
  }
};

// Check if user already exists by phone number
export const checkUserExistsByPhone = async (phone: string): Promise<{ exists: boolean; error?: string }> => {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    
    if (!normalizedPhone) {
      return { exists: false };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, phone')
      .eq('phone', normalizedPhone)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking user by phone:', error);
      return { exists: false, error: 'Failed to check phone availability' };
    }

    return { exists: !!data };
  } catch (error) {
    console.error('Error checking user by phone:', error);
    return { exists: false, error: 'Failed to check phone availability' };
  }
};

// Comprehensive validation for signup form
export const validateSignupData = async (
  email: string, 
  phone: string
): Promise<{
  valid: boolean;
  errors: string[];
  emailSuggestion?: string;
}> => {
  const errors: string[] = [];
  let emailSuggestion: string | undefined;

  // Check email typo
  const { hasTypo, suggestion } = checkEmailTypo(email);
  if (hasTypo && suggestion) {
    emailSuggestion = suggestion;
  }

  // Use corrected email for existence check if available
  const emailToCheck = emailSuggestion || email;

  // Check if email already exists
  const emailCheck = await checkUserExistsByEmail(emailToCheck);
  if (emailCheck.error) {
    errors.push(emailCheck.error);
  } else if (emailCheck.exists) {
    errors.push('An account with this email already exists. Please sign in instead.');
  }

  // Check if phone already exists
  const phoneCheck = await checkUserExistsByPhone(phone);
  if (phoneCheck.error) {
    errors.push(phoneCheck.error);
  } else if (phoneCheck.exists) {
    errors.push('An account with this phone number already exists. Please sign in instead.');
  }

  return {
    valid: errors.length === 0,
    errors,
    emailSuggestion: hasTypo ? emailSuggestion : undefined
  };
};