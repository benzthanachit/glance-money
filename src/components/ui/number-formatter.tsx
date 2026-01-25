'use client';

import React from 'react';
import { useLocale } from '@/lib/contexts/language-context';
import { formatNumber, formatPercentage } from '@/lib/utils/formatting';
import { Locale } from '@/i18n/config';

interface NumberFormatterProps {
  value: number;
  locale?: Locale;
  className?: string;
  options?: Intl.NumberFormatOptions;
}

interface PercentageFormatterProps {
  value: number;
  decimals?: number;
  locale?: Locale;
  className?: string;
}

/**
 * NumberFormatter component for displaying formatted numbers
 * Supports Thai and English locales with custom formatting options
 */
export function NumberFormatter({ 
  value, 
  locale: propLocale,
  className = '',
  options = {}
}: NumberFormatterProps) {
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale;

  const formattedNumber = formatNumber(locale, value, options);

  return (
    <span className={className} data-testid="number-formatter">
      {formattedNumber}
    </span>
  );
}

/**
 * PercentageFormatter component for displaying formatted percentages
 */
export function PercentageFormatter({ 
  value, 
  decimals = 1,
  locale: propLocale,
  className = '' 
}: PercentageFormatterProps) {
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale;

  const formattedPercentage = formatPercentage(locale, value, decimals);

  return (
    <span className={className} data-testid="percentage-formatter">
      {formattedPercentage}
    </span>
  );
}

/**
 * CompactNumberFormatter for large numbers with compact notation
 */
export function CompactNumberFormatter({ 
  value, 
  locale: propLocale,
  className = '' 
}: Omit<NumberFormatterProps, 'options'>) {
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale;

  const options: Intl.NumberFormatOptions = {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  };

  const formattedNumber = formatNumber(locale, value, options);

  return (
    <span className={className} data-testid="compact-number-formatter">
      {formattedNumber}
    </span>
  );
}

/**
 * DecimalFormatter for precise decimal formatting
 */
export function DecimalFormatter({ 
  value, 
  decimals = 2,
  locale: propLocale,
  className = '' 
}: Omit<NumberFormatterProps, 'options'> & { decimals?: number }) {
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale;

  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  };

  const formattedNumber = formatNumber(locale, value, options);

  return (
    <span className={className} data-testid="decimal-formatter">
      {formattedNumber}
    </span>
  );
}

export default NumberFormatter;