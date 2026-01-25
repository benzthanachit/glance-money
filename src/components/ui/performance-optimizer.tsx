'use client';

import React, { useEffect } from 'react';
import { addResourceHints, optimizeCSSDelivery, reportPerformanceMetrics } from '@/lib/utils/asset-optimization';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  enableResourceHints?: boolean;
  enableCSSOptimization?: boolean;
  enablePerformanceReporting?: boolean;
}

export function PerformanceOptimizer({
  children,
  enableResourceHints = true,
  enableCSSOptimization = true,
  enablePerformanceReporting = true
}: PerformanceOptimizerProps) {
  useEffect(() => {
    // Run optimizations after component mounts
    if (enableResourceHints) {
      addResourceHints();
    }
    
    if (enableCSSOptimization) {
      optimizeCSSDelivery();
    }
    
    if (enablePerformanceReporting) {
      reportPerformanceMetrics();
    }
  }, [enableResourceHints, enableCSSOptimization, enablePerformanceReporting]);

  return <>{children}</>;
}

// Component for critical resource preloading
interface CriticalResourcesProps {
  fonts?: string[];
  images?: string[];
  scripts?: string[];
}

export function CriticalResources({ fonts = [], images = [], scripts = [] }: CriticalResourcesProps) {
  useEffect(() => {
    // Preload critical fonts
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Preload critical images
    images.forEach(image => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = image;
      link.as = 'image';
      document.head.appendChild(link);
    });

    // Preload critical scripts
    scripts.forEach(script => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = script;
      link.as = 'script';
      document.head.appendChild(link);
    });
  }, [fonts, images, scripts]);

  return null;
}

// Component for lazy loading non-critical resources
interface LazyResourcesProps {
  stylesheets?: string[];
  scripts?: string[];
}

export function LazyResources({ stylesheets = [], scripts = [] }: LazyResourcesProps) {
  useEffect(() => {
    // Load non-critical stylesheets
    stylesheets.forEach(stylesheet => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = stylesheet;
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
      };
      document.head.appendChild(link);
    });

    // Load non-critical scripts
    scripts.forEach(script => {
      const scriptElement = document.createElement('script');
      scriptElement.src = script;
      scriptElement.async = true;
      document.body.appendChild(scriptElement);
    });
  }, [stylesheets, scripts]);

  return null;
}

// Hook for performance monitoring
export function usePerformanceOptimization() {
  useEffect(() => {
    // Optimize images loading
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      if ('loading' in HTMLImageElement.prototype) {
        // Native lazy loading is supported
        return;
      }
      
      // Fallback for browsers without native lazy loading
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const image = entry.target as HTMLImageElement;
            image.src = image.dataset.src || image.src;
            image.classList.remove('lazy');
            observer.unobserve(image);
          }
        });
      });
      
      observer.observe(img);
    });

    // Optimize font loading
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        document.body.classList.add('fonts-loaded');
      });
    }

    // Prefetch next page resources on hover
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const href = (link as HTMLAnchorElement).href;
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = href;
        document.head.appendChild(prefetchLink);
      }, { once: true });
    });
  }, []);
}

export default PerformanceOptimizer;