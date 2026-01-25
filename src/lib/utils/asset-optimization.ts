'use client';

// Asset optimization utilities for mobile performance

export interface AssetConfig {
  quality: number;
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  sizes: string;
  loading: 'lazy' | 'eager';
  priority: boolean;
}

// Preset configurations for different asset types
export const AssetPresets: Record<string, AssetConfig> = {
  hero: {
    quality: 85,
    format: 'webp',
    sizes: '100vw',
    loading: 'eager',
    priority: true
  },
  thumbnail: {
    quality: 75,
    format: 'webp',
    sizes: '(max-width: 768px) 150px, 200px',
    loading: 'lazy',
    priority: false
  },
  icon: {
    quality: 90,
    format: 'webp',
    sizes: '(max-width: 768px) 24px, 32px',
    loading: 'lazy',
    priority: false
  },
  avatar: {
    quality: 80,
    format: 'webp',
    sizes: '(max-width: 768px) 64px, 96px',
    loading: 'lazy',
    priority: false
  }
};

// Generate responsive image URLs (for external image services)
export function generateResponsiveImageUrl(
  baseUrl: string,
  width: number,
  height?: number,
  quality: number = 75,
  format: string = 'webp'
): string {
  const params = new URLSearchParams({
    w: width.toString(),
    q: quality.toString(),
    f: format
  });
  
  if (height) {
    params.set('h', height.toString());
  }
  
  return `${baseUrl}?${params.toString()}`;
}

// Generate srcSet for responsive images
export function generateSrcSet(
  baseUrl: string,
  widths: number[],
  quality: number = 75,
  format: string = 'webp'
): string {
  return widths
    .map(width => `${generateResponsiveImageUrl(baseUrl, width, undefined, quality, format)} ${width}w`)
    .join(', ');
}

// Common responsive breakpoints
export const ResponsiveBreakpoints = {
  mobile: [320, 480, 640],
  tablet: [768, 1024],
  desktop: [1280, 1536, 1920]
} as const;

// Get optimal image configuration based on viewport
export function getOptimalImageConfig(
  viewport: 'mobile' | 'tablet' | 'desktop',
  assetType: keyof typeof AssetPresets = 'thumbnail'
): AssetConfig {
  const baseConfig = AssetPresets[assetType];
  
  // Adjust quality based on viewport
  const qualityAdjustment = {
    mobile: -10, // Lower quality for mobile to save bandwidth
    tablet: 0,   // Standard quality
    desktop: +5  // Slightly higher quality for desktop
  };
  
  return {
    ...baseConfig,
    quality: Math.max(50, Math.min(95, baseConfig.quality + qualityAdjustment[viewport]))
  };
}

// Preload critical assets
export function preloadAsset(url: string, type: 'image' | 'font' | 'style' | 'script' = 'image') {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  
  switch (type) {
    case 'image':
      link.as = 'image';
      break;
    case 'font':
      link.as = 'font';
      link.crossOrigin = 'anonymous';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'script':
      link.as = 'script';
      break;
  }
  
  document.head.appendChild(link);
}

// Lazy load assets when they come into viewport
export function lazyLoadAsset(
  element: HTMLElement,
  src: string,
  options: IntersectionObserverInit = {}
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLImageElement;
        target.src = src;
        target.classList.remove('lazy');
        observer.unobserve(target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  });
  
  observer.observe(element);
  
  return () => observer.disconnect();
}

// Optimize CSS delivery
export function optimizeCSSDelivery() {
  if (typeof window === 'undefined') return;
  
  // Load non-critical CSS asynchronously
  const nonCriticalCSS = document.querySelectorAll('link[rel="preload"][as="style"]');
  nonCriticalCSS.forEach(link => {
    const linkElement = link as HTMLLinkElement;
    linkElement.onload = () => {
      linkElement.rel = 'stylesheet';
    };
  });
}

// Resource hints for better performance
export function addResourceHints() {
  if (typeof window === 'undefined') return;
  
  // DNS prefetch for external domains
  const domains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
  
  // Preconnect to critical external resources
  const criticalDomains = [
    'fonts.googleapis.com'
  ];
  
  criticalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = `https://${domain}`;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Monitor and report performance metrics
export function reportPerformanceMetrics() {
  if (typeof window === 'undefined') return;
  
  // Report Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Log metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${entry.name}:`, (entry as any).value);
      }
      
      // In production, you might want to send these to an analytics service
      // analytics.track('performance_metric', {
      //   name: entry.name,
      //   value: entry.value,
      //   rating: entry.rating
      // });
    }
  });
  
  try {
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
  } catch (e) {
    // PerformanceObserver not supported
  }
}