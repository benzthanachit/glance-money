'use client';

import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingManager {
  isLoading: (key: string) => boolean;
  setLoading: (key: string, loading: boolean) => void;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  isAnyLoading: () => boolean;
  getLoadingStates: () => LoadingState;
  clearAll: () => void;
}

export function useLoadingStates(initialStates: LoadingState = {}): LoadingManager {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(initialStates);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const setLoading = useCallback((key: string, loading: boolean) => {
    // Clear any existing timeout for this key
    const existingTimeout = timeoutsRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutsRef.current.delete(key);
    }

    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const startLoading = useCallback((key: string) => {
    setLoading(key, true);
  }, [setLoading]);

  const stopLoading = useCallback((key: string) => {
    setLoading(key, false);
  }, [setLoading]);

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const getLoadingStates = useCallback((): LoadingState => {
    return { ...loadingStates };
  }, [loadingStates]);

  const clearAll = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
    
    setLoadingStates({});
  }, []);

  return {
    isLoading,
    setLoading,
    startLoading,
    stopLoading,
    isAnyLoading,
    getLoadingStates,
    clearAll
  };
}

// Hook for managing async operations with loading states
export function useAsyncOperation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      timeout?: number;
    } = {}
  ) => {
    const { onSuccess, onError, timeout = 10000 } = options;
    
    setLoading(true);
    setError(null);

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeout);
      });

      // Race between the operation and timeout
      const result = await Promise.race([operation(), timeoutPromise]);
      
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset
  };
}

// Hook for debounced loading states
export function useDebouncedLoading(delay: number = 300) {
  const [loading, setLoading] = useState(false);
  const [debouncedLoading, setDebouncedLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const setLoadingState = useCallback((newLoading: boolean) => {
    setLoading(newLoading);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (newLoading) {
      // Show loading immediately when starting
      setDebouncedLoading(true);
    } else {
      // Delay hiding loading to prevent flicker
      timeoutRef.current = setTimeout(() => {
        setDebouncedLoading(false);
      }, delay);
    }
  }, [delay]);

  return {
    loading,
    debouncedLoading,
    setLoading: setLoadingState
  };
}

// Hook for progressive loading with stages
export function useProgressiveLoading<T extends string>(stages: T[]) {
  const [currentStage, setCurrentStage] = useState<T | null>(null);
  const [completedStages, setCompletedStages] = useState<Set<T>>(new Set());
  const [progress, setProgress] = useState(0);

  const startStage = useCallback((stage: T) => {
    setCurrentStage(stage);
  }, []);

  const completeStage = useCallback((stage: T) => {
    setCompletedStages(prev => new Set([...prev, stage]));
    setCurrentStage(null);
    
    // Update progress
    const newProgress = (completedStages.size + 1) / stages.length * 100;
    setProgress(newProgress);
  }, [completedStages.size, stages.length]);

  const isStageComplete = useCallback((stage: T) => {
    return completedStages.has(stage);
  }, [completedStages]);

  const isStageActive = useCallback((stage: T) => {
    return currentStage === stage;
  }, [currentStage]);

  const reset = useCallback(() => {
    setCurrentStage(null);
    setCompletedStages(new Set());
    setProgress(0);
  }, []);

  return {
    currentStage,
    completedStages,
    progress,
    startStage,
    completeStage,
    isStageComplete,
    isStageActive,
    reset,
    isComplete: progress === 100
  };
}