'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from './skeleton';

interface LazyWrapperProps {
  fallback?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function LazyWrapper({ 
  fallback = <Skeleton className="h-48 w-full" />, 
  className,
  children 
}: LazyWrapperProps) {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return function LazyLoadedComponent(props: P) {
    return (
      <Suspense fallback={fallback || <Skeleton className="h-48 w-full" />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Hook for intersection observer-based lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return { isIntersecting, hasIntersected };
}

// Component for viewport-based lazy loading
interface ViewportLazyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export function ViewportLazy({
  children,
  fallback = <Skeleton className="h-48 w-full" />,
  className,
  threshold = 0.1,
  rootMargin = '50px'
}: ViewportLazyProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { hasIntersected } = useIntersectionObserver(ref as React.RefObject<Element>, {
    threshold,
    rootMargin
  });

  return (
    <div ref={ref} className={className}>
      {hasIntersected ? children : fallback}
    </div>
  );
}