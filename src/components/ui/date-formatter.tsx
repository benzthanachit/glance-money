'use client';

import React from 'react';
import { useLocale } from '@/lib/contexts/language-context';
import { formatDate, formatTime, formatRelativeTime } from '@/lib/utils/formatting';
import { Locale } from '@/i18n/config';
import { ClientOnly } from './client-only';

interface DateFormatterProps {
  date: Date;
  format?: 'short' | 'medium' | 'long';
  locale?: Locale;
  className?: string;
}

interface TimeFormatterProps {
  date: Date;
  locale?: Locale;
  className?: string;
}

interface RelativeTimeFormatterProps {
  date: Date;
  baseDate?: Date;
  locale?: Locale;
  className?: string;
}

/**
 * DateFormatter component for displaying formatted dates
 * Supports Thai and English locales with different format options
 */
export function DateFormatter({ 
  date, 
  format = 'medium', 
  locale: propLocale,
  className = '' 
}: DateFormatterProps) {
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale;

  return (
    <ClientOnly fallback={<span className={className}>Loading...</span>}>
      <span className={className} data-testid="date-formatter">
        {formatDate({ locale, date, format })}
      </span>
    </ClientOnly>
  );
}

/**
 * TimeFormatter component for displaying formatted times
 * Uses 24-hour format for Thai locale and 12-hour format for English
 */
export function TimeFormatter({ 
  date, 
  locale: propLocale,
  className = '' 
}: TimeFormatterProps) {
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale;

  return (
    <ClientOnly fallback={<span className={className}>Loading...</span>}>
      <span className={className} data-testid="time-formatter">
        {formatTime(locale, date)}
      </span>
    </ClientOnly>
  );
}

/**
 * RelativeTimeFormatter component for displaying relative time
 * Shows "2 days ago", "in 3 months", etc.
 */
export function RelativeTimeFormatter({ 
  date, 
  baseDate = new Date(),
  locale: propLocale,
  className = '' 
}: RelativeTimeFormatterProps) {
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale;

  return (
    <ClientOnly fallback={<span className={className}>Loading...</span>}>
      <span className={className} data-testid="relative-time-formatter">
        {formatRelativeTime(locale, date, baseDate)}
      </span>
    </ClientOnly>
  );
}

/**
 * Combined DateTime formatter for showing both date and time
 */
export function DateTimeFormatter({ 
  date, 
  format = 'medium',
  locale: propLocale,
  className = '',
  showTime = false 
}: DateFormatterProps & { showTime?: boolean }) {
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale;

  return (
    <ClientOnly fallback={<span className={className}>Loading...</span>}>
      <span className={className} data-testid="datetime-formatter">
        {formatDate({ locale, date, format })}
        {showTime && ` ${formatTime(locale, date)}`}
      </span>
    </ClientOnly>
  );
}

export default DateFormatter;