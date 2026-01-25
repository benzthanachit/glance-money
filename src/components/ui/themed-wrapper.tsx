'use client';

import React from 'react';
import { useNetStatusThemeOnly } from '@/lib/hooks/useNetStatusTheme';
import { cn } from '@/lib/utils';

interface ThemedWrapperProps {
  children: React.ReactNode;
  className?: string;
  applyBackground?: boolean;
  applyBorder?: boolean;
  applyAccent?: boolean;
}

/**
 * Wrapper component that applies theme-based styling
 */
export function ThemedWrapper({
  children,
  className,
  applyBackground = false,
  applyBorder = false,
  applyAccent = false
}: ThemedWrapperProps) {
  const { theme, isTransitioning } = useNetStatusThemeOnly();

  const themeClasses = cn(
    'theme-transition',
    {
      'net-status-bg': applyBackground,
      'net-status-border': applyBorder,
      'net-status-accent': applyAccent,
      'scale-[1.01] shadow-sm': isTransitioning,
    },
    className
  );

  return (
    <div className={themeClasses} data-theme={theme}>
      {children}
    </div>
  );
}

interface ThemedTextProps {
  children: React.ReactNode;
  variant?: 'primary' | 'accent';
  className?: string;
}

/**
 * Text component that applies theme-based colors
 */
export function ThemedText({
  children,
  variant = 'primary',
  className
}: ThemedTextProps) {
  const { theme } = useNetStatusThemeOnly();

  const themeClasses = cn(
    'theme-transition',
    {
      'net-status-primary': variant === 'primary',
      'net-status-accent': variant === 'accent',
    },
    className
  );

  return (
    <span className={themeClasses} data-theme={theme}>
      {children}
    </span>
  );
}

export default ThemedWrapper;