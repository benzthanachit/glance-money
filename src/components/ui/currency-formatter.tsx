'use client';

import React from 'react';
import { useLocale } from '@/lib/contexts/language-context';
import { formatCurrency, Currency } from '@/lib/utils/formatting';
import { Locale } from '@/i18n/config';

interface CurrencyFormatterProps {
  amount: number;
  currency?: Currency;
  locale?: Locale;
  className?: string;
  showSymbol?: boolean;
}

/**
 * CurrencyFormatter component for displaying formatted currency values
 * Supports Thai Baht and other currencies with proper locale formatting
 */
export function CurrencyFormatter({ 
  amount, 
  currency = 'THB', 
  locale: propLocale,
  className = '',
  showSymbol = true 
}: CurrencyFormatterProps) {
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale;

  const formattedAmount = formatCurrency({
    locale,
    currency,
    amount
  });

  // If showSymbol is false, remove currency symbols
  const displayAmount = showSymbol 
    ? formattedAmount 
    : formattedAmount.replace(/[฿$€]/g, '').trim();

  return (
    <span className={className} data-testid="currency-formatter">
      {displayAmount}
    </span>
  );
}

/**
 * Compact currency formatter for smaller displays
 */
export function CompactCurrencyFormatter({ 
  amount, 
  currency = 'THB', 
  locale: propLocale,
  className = '' 
}: Omit<CurrencyFormatterProps, 'showSymbol'>) {
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale;

  // Format with compact notation for large numbers
  const formatOptions: Intl.NumberFormatOptions = {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  };

  const localeMap = {
    th: 'th-TH',
    en: 'en-US'
  };

  const formatter = new Intl.NumberFormat(localeMap[locale], formatOptions);
  const compactAmount = formatter.format(amount);
  
  const currencySymbol = currency === 'THB' ? '฿' : currency === 'USD' ? '$' : '€';

  return (
    <span className={className} data-testid="compact-currency-formatter">
      {currencySymbol}{compactAmount}
    </span>
  );
}

export default CurrencyFormatter;