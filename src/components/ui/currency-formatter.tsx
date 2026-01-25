'use client';

import React from 'react';
import { useLocale } from '@/lib/contexts/language-context';
import { formatCurrency, Currency } from '@/lib/utils/formatting';
import { Locale } from '@/i18n/config';
import { ClientOnly } from './client-only';

interface CurrencyFormatterProps {
  amount: number;
  currency?: Currency;
  locale?: Locale;
  className?: string;
  showSymbol?: boolean;
  showSign?: boolean;
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
  showSymbol = true,
  showSign = false
}: CurrencyFormatterProps) {
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale;

  return (
    <ClientOnly fallback={<span className={className}>Loading...</span>}>
      <CurrencyFormatterInner
        amount={amount}
        currency={currency}
        locale={locale}
        className={className}
        showSymbol={showSymbol}
        showSign={showSign}
      />
    </ClientOnly>
  );
}

function CurrencyFormatterInner({ 
  amount, 
  currency = 'THB', 
  locale,
  className = '',
  showSymbol = true,
  showSign = false
}: CurrencyFormatterProps & { locale: Locale }) {
  const formattedAmount = formatCurrency({
    locale,
    currency,
    amount: Math.abs(amount)
  });

  // If showSymbol is false, remove currency symbols
  let displayAmount = showSymbol 
    ? formattedAmount 
    : formattedAmount.replace(/[฿$€]/g, '').trim();

  // Add sign if requested
  if (showSign) {
    const sign = amount >= 0 ? '+' : '-';
    displayAmount = `${sign}${displayAmount}`;
  } else if (amount < 0) {
    displayAmount = `-${displayAmount}`;
  }

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

  return (
    <ClientOnly fallback={<span className={className}>Loading...</span>}>
      <CompactCurrencyFormatterInner
        amount={amount}
        currency={currency}
        locale={locale}
        className={className}
      />
    </ClientOnly>
  );
}

function CompactCurrencyFormatterInner({ 
  amount, 
  currency = 'THB', 
  locale,
  className = '' 
}: { amount: number; currency?: Currency; locale: Locale; className?: string }) {
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