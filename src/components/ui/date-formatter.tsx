'use client';

import React from 'react';
import { useLocale } from '@/lib/contexts/language-context';
import { formatDate, formatTime, formatRelativeTime } from '@/lib/utils/formatting';
import { Locale } from '@/i18n/config';

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

  const formattedDate = formatDate({ locale, date, format });

  return (
    <span className={className} data-testid="date-formatter">
      {formattedDate}
    </span>
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

  const formattedTime = formatTime(locale, date);

  return (
    <span className={className} data-testid="time-formatter">
      {formattedTime}
    </span>
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

  const formattedRelativeTime = formatRelativeTime(locale, date, baseDate);

  return (
    <span className={className} data-testid="relative-time-formatter">
      {formattedRelativeTime}
    </span>
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

  const formattedDate = formatDate({ locale, date, format });
  const formattedTime = showTime ? formatTime(locale, date) : '';

  return (
    <span className={className} data-testid="datetime-formatter">
      {formattedDate}
      {showTime && ` ${formattedTime}`}
    </span>
  );
}

export default DateFormatter;