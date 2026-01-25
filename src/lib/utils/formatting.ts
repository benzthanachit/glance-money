import { Locale } from '@/i18n/config';

export type Currency = 'THB' | 'USD' | 'EUR';

export interface FormatCurrencyOptions {
  locale: Locale;
  currency: Currency;
  amount: number;
}

export interface FormatDateOptions {
  locale: Locale;
  date: Date;
  format?: 'short' | 'long' | 'medium';
}

/**
 * Format currency based on locale and currency type
 */
export function formatCurrency({ locale, currency, amount }: FormatCurrencyOptions): string {
  const localeMap = {
    th: 'th-TH',
    en: 'en-US'
  };

  const currencySymbols = {
    THB: '฿',
    USD: '$',
    EUR: '€'
  };

  try {
    // For Thai locale, we'll use custom formatting to match local conventions
    if (locale === 'th' && currency === 'THB') {
      const formatter = new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `฿${formatter.format(amount)}`;
    }

    // For other combinations, use standard Intl formatting
    const formatter = new Intl.NumberFormat(localeMap[locale], {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(amount);
  } catch (error) {
    // Fallback formatting if Intl fails
    const symbol = currencySymbols[currency] || currency;
    const formattedAmount = amount.toLocaleString(localeMap[locale], {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol}${formattedAmount}`;
  }
}

/**
 * Format date based on locale and format type
 */
export function formatDate({ locale, date, format = 'medium' }: FormatDateOptions): string {
  const localeMap = {
    th: 'th-TH',
    en: 'en-US'
  };

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    },
    medium: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }
  };

  try {
    const formatter = new Intl.DateTimeFormat(localeMap[locale], formatOptions[format]);
    return formatter.format(date);
  } catch (error) {
    // Fallback to ISO string if formatting fails
    return date.toISOString().split('T')[0];
  }
}

/**
 * Format number based on locale
 */
export function formatNumber(locale: Locale, number: number, options?: Intl.NumberFormatOptions): string {
  const localeMap = {
    th: 'th-TH',
    en: 'en-US'
  };

  try {
    const formatter = new Intl.NumberFormat(localeMap[locale], options);
    return formatter.format(number);
  } catch (error) {
    return number.toString();
  }
}

/**
 * Get currency symbol for a given currency
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols = {
    THB: '฿',
    USD: '$',
    EUR: '€'
  };
  return symbols[currency] || currency;
}

/**
 * Parse currency string back to number
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and spaces, then parse
  const cleanString = currencyString.replace(/[฿$€,\s]/g, '');
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format percentage based on locale
 */
export function formatPercentage(locale: Locale, value: number, decimals: number = 1): string {
  const localeMap = {
    th: 'th-TH',
    en: 'en-US'
  };

  try {
    const formatter = new Intl.NumberFormat(localeMap[locale], {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return formatter.format(value / 100);
  } catch (error) {
    return `${value.toFixed(decimals)}%`;
  }
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 months")
 */
export function formatRelativeTime(locale: Locale, date: Date, baseDate: Date = new Date()): string {
  const localeMap = {
    th: 'th-TH',
    en: 'en-US'
  };

  try {
    const formatter = new Intl.RelativeTimeFormat(localeMap[locale], {
      numeric: 'auto',
      style: 'long'
    });

    const diffInMs = date.getTime() - baseDate.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

    if (Math.abs(diffInDays) < 7) {
      return formatter.format(diffInDays, 'day');
    } else if (Math.abs(diffInDays) < 30) {
      const weeks = Math.round(diffInDays / 7);
      return formatter.format(weeks, 'week');
    } else if (Math.abs(diffInDays) < 365) {
      const months = Math.round(diffInDays / 30);
      return formatter.format(months, 'month');
    } else {
      const years = Math.round(diffInDays / 365);
      return formatter.format(years, 'year');
    }
  } catch (error) {
    return formatDate({ locale, date, format: 'short' });
  }
}

/**
 * Get localized month names
 */
export function getMonthNames(locale: Locale): string[] {
  const localeMap = {
    th: 'th-TH',
    en: 'en-US'
  };

  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(2024, i, 1);
    const formatter = new Intl.DateTimeFormat(localeMap[locale], { month: 'long' });
    months.push(formatter.format(date));
  }
  return months;
}

/**
 * Get localized day names
 */
export function getDayNames(locale: Locale): string[] {
  const localeMap = {
    th: 'th-TH',
    en: 'en-US'
  };

  const days: string[] = [];
  // Start from Sunday (0) to Saturday (6)
  for (let i = 0; i < 7; i++) {
    const date = new Date(2024, 0, i + 7); // January 7, 2024 is a Sunday
    const formatter = new Intl.DateTimeFormat(localeMap[locale], { weekday: 'long' });
    days.push(formatter.format(date));
  }
  return days;
}

/**
 * Format time based on locale (24h vs 12h format)
 */
export function formatTime(locale: Locale, date: Date): string {
  const localeMap = {
    th: 'th-TH',
    en: 'en-US'
  };

  try {
    const formatter = new Intl.DateTimeFormat(localeMap[locale], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: locale === 'en' // Use 12-hour format for English, 24-hour for Thai
    });
    return formatter.format(date);
  } catch (error) {
    return date.toLocaleTimeString();
  }
}