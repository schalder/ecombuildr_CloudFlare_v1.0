// Currency formatting utilities for course pricing

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US'
  },
  BDT: {
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    locale: 'bn-BD'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'en-EU'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB'
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN'
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    locale: 'en-CA'
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    locale: 'en-AU'
  }
};

/**
 * Format a price according to the specified currency
 */
export function formatCoursePrice(
  amount: number,
  currency: string = 'USD',
  showSymbol: boolean = true
): string {
  const currencyConfig = SUPPORTED_CURRENCIES[currency];
  
  if (!currencyConfig) {
    // Fallback to USD if currency not supported
    return formatCoursePrice(amount, 'USD', showSymbol);
  }

  if (!showSymbol) {
    return amount.toLocaleString(currencyConfig.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  // For currencies with custom symbols, use them directly
  if (currency === 'BDT') {
    return `৳${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  try {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: currencyConfig.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    // Fallback if Intl.NumberFormat fails
    return `${currencyConfig.symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string = 'USD'): string {
  return SUPPORTED_CURRENCIES[currency]?.symbol || '$';
}

/**
 * Get currency name for a given currency code
 */
export function getCurrencyName(currency: string = 'USD'): string {
  return SUPPORTED_CURRENCIES[currency]?.name || 'US Dollar';
}

/**
 * Check if a currency is supported
 */
export function isSupportedCurrency(currency: string): boolean {
  return currency in SUPPORTED_CURRENCIES;
}