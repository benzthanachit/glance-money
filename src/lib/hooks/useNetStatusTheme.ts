'use client';

import { useEffect } from 'react';
import { useNetStatus } from './useFinancialSummary';
import { useTheme } from '@/lib/contexts/theme-context';

/**
 * Hook that automatically manages theme based on Net Status
 * Combines financial data with theme management
 */
export function useNetStatusTheme() {
  const { netStatus, theme, totalIncome, totalExpenses, loading, error, refresh } = useNetStatus();
  const { netStatusTheme, setNetStatusTheme, isTransitioning } = useTheme();

  // Update theme when net status changes
  useEffect(() => {
    if (!loading && theme !== netStatusTheme) {
      setNetStatusTheme(theme);
    }
  }, [theme, netStatusTheme, setNetStatusTheme, loading]);

  return {
    // Financial data
    netStatus,
    totalIncome,
    totalExpenses,
    loading,
    error,
    refresh,
    
    // Theme data
    theme: netStatusTheme,
    isTransitioning,
    
    // Combined state
    isReady: !loading && !error,
  };
}

/**
 * Hook for components that only need theme information
 */
export function useNetStatusThemeOnly() {
  const { netStatusTheme, isTransitioning } = useTheme();
  
  return {
    theme: netStatusTheme,
    isTransitioning,
  };
}