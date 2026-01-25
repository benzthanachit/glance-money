import { useState, useEffect, useCallback } from 'react';
import { FinancialSummary, CategorySummary } from '@/lib/types';
import { financialService } from '@/lib/services/financialService';

interface UseFinancialSummaryReturn {
  summary: FinancialSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  netStatus: number;
  theme: 'positive' | 'negative';
  categoryBreakdown: CategorySummary[];
}

/**
 * Hook for managing financial summary with real-time updates
 */
export function useFinancialSummary(): UseFinancialSummaryReturn {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await financialService.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Subscribe to financial summary updates
    const unsubscribe = financialService.subscribe((newSummary) => {
      setSummary(newSummary);
      setLoading(false);
      setError(null);
    });

    // Initial load
    refresh();

    return unsubscribe;
  }, [refresh]);

  const netStatus = summary?.netStatus ?? 0;
  const theme = netStatus >= 0 ? 'positive' : 'negative';
  const categoryBreakdown = summary?.categoryBreakdown ?? [];

  return {
    summary,
    loading,
    error,
    refresh,
    netStatus,
    theme,
    categoryBreakdown
  };
}

interface UseNetStatusReturn {
  netStatus: number;
  theme: 'positive' | 'negative';
  totalIncome: number;
  totalExpenses: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook specifically for Net Status data
 */
export function useNetStatus(): UseNetStatusReturn {
  const [data, setData] = useState({
    netStatus: 0,
    theme: 'positive' as 'positive' | 'negative',
    totalIncome: 0,
    totalExpenses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const netStatusData = await financialService.getNetStatusData();
      setData(netStatusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load net status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Subscribe to financial summary updates for real-time net status
    const unsubscribe = financialService.subscribe((summary) => {
      setData({
        netStatus: summary.netStatus,
        theme: summary.netStatus >= 0 ? 'positive' : 'negative',
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpenses
      });
      setLoading(false);
      setError(null);
    });

    // Initial load
    refresh();

    return unsubscribe;
  }, [refresh]);

  return {
    ...data,
    loading,
    error,
    refresh
  };
}

interface UseCategoryBreakdownReturn {
  categoryBreakdown: CategorySummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook specifically for category breakdown data
 */
export function useCategoryBreakdown(): UseCategoryBreakdownReturn {
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const breakdown = await financialService.getCategoryBreakdown();
      setCategoryBreakdown(breakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load category breakdown');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Subscribe to financial summary updates for real-time category breakdown
    const unsubscribe = financialService.subscribe((summary) => {
      setCategoryBreakdown(summary.categoryBreakdown);
      setLoading(false);
      setError(null);
    });

    // Initial load
    refresh();

    return unsubscribe;
  }, [refresh]);

  return {
    categoryBreakdown,
    loading,
    error,
    refresh
  };
}