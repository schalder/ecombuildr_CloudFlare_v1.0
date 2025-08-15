// Currency utilities
// Keep it simple and centralized so all price displays stay consistent.

export type CurrencyCode = 'BDT' | 'USD' | 'INR' | 'EUR' | 'GBP';

const currencyLocaleMap: Record<CurrencyCode, string> = {
  BDT: 'en-BD',
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'en-IE',
  GBP: 'en-GB',
};

export function setGlobalCurrency(code: CurrencyCode, locale?: string) {
  if (typeof window !== 'undefined') {
    (window as any).__CURRENCY_CODE__ = code;
    (window as any).__CURRENCY_LOCALE__ = locale || currencyLocaleMap[code] || 'en-US';
  }
}

export function getGlobalCurrencyCode(): CurrencyCode {
  if (typeof window !== 'undefined' && (window as any).__CURRENCY_CODE__) {
    return (window as any).__CURRENCY_CODE__ as CurrencyCode;
  }
  return 'BDT'; // Default to Bangladeshi Taka
}

export function getGlobalCurrencyLocale(): string {
  if (typeof window !== 'undefined' && (window as any).__CURRENCY_LOCALE__) {
    return (window as any).__CURRENCY_LOCALE__ as string;
  }
  const code = getGlobalCurrencyCode();
  return currencyLocaleMap[code] || 'en-US';
}

export function formatCurrency(amount: number, opts?: { code?: CurrencyCode; locale?: string }) {
  const code = opts?.code || getGlobalCurrencyCode();
  const locale = opts?.locale || getGlobalCurrencyLocale();
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount ?? 0);
  } catch {
    // Fallback
    const symbol = code === 'BDT' ? '৳' : code === 'USD' ? '$' : code;
    return `${symbol}${(amount ?? 0).toFixed(2)}`;
  }
}
