'use client';

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
}

export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const startTimeRef = useRef<number>(0);
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    renderStartRef.current = Date.now();
  }, []);

  useEffect(() => {
    const loadTime = Date.now() - startTimeRef.current;
    const renderTime = Date.now() - renderStartRef.current;

    // Measure memory usage if available
    const memoryUsage = (performance as any).memory?.usedJSHeapSize;

    setMetrics({
      loadTime,
      renderTime,
      interactionTime: 0, // Will be updated on interactions
      memoryUsage
    });

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}:`, {
        loadTime: `${loadTime}ms`,
        renderTime: `${renderTime}ms`,
        memoryUsage: memoryUsage ? `${(memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A'
      });
    }
  }, [componentName]);

  const measureInteraction = (interactionName: string) => {
    const startTime = Date.now();
    
    return () => {
      const interactionTime = Date.now() - startTime;
      setMetrics(prev => prev ? { ...prev, interactionTime } : null);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} - ${interactionName}:`, `${interactionTime}ms`);
      }
    };
  };

  return { metrics, measureInteraction };
}

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string, dependencies: unknown[] = []) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(0);

  useEffect(() => {
    lastRenderTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    renderCountRef.current += 1;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTimeRef.current;
    lastRenderTimeRef.current = currentTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render] ${componentName} - Render #${renderCountRef.current}`, {
        timeSinceLastRender: `${timeSinceLastRender}ms`,
        dependencies: dependencies.length
      });
    }
  }, dependencies);

  return renderCountRef.current;
}

// Hook for detecting slow renders
export function useSlowRenderDetection(componentName: string, threshold: number = 16) {
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    
    if (renderTime > threshold) {
      console.warn(`[Slow Render] ${componentName} took ${renderTime.toFixed(2)}ms to render (threshold: ${threshold}ms)`);
    }
  });
}

// Hook for measuring Web Vitals
export function useWebVitals() {
  const [vitals, setVitals] = useState<{
    CLS?: number;
    FID?: number;
    FCP?: number;
    LCP?: number;
    TTFB?: number;
  }>({});

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Measure First Contentful Paint (FCP)
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          setVitals(prev => ({ ...prev, FCP: entry.startTime }));
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // PerformanceObserver not supported
    }

    // Measure Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      setVitals(prev => ({ ...prev, LCP: lastEntry.startTime }));
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Not supported
    }

    return () => {
      observer.disconnect();
      lcpObserver.disconnect();
    };
  }, []);

  return vitals;
}