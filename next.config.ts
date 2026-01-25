import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

const nextConfig: NextConfig = {
  output: 'standalone', // Enable standalone output for Docker
  turbopack: {}, // Enable Turbopack explicitly
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-toast'
    ],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [320, 420, 768, 1024, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Framework chunk (React, Next.js)
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // UI library chunk
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          // Supabase chunk
          supabase: {
            name: 'supabase',
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            chunks: 'all',
            priority: 25,
          },
          // Common libraries
          lib: {
            name: 'lib',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 20,
            minChunks: 2,
          },
        },
      };
    }
    
    return config;
  },
  
  // Compression
  compress: true,
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
    ];
  },
};

// For now, we'll configure PWA manually in the service worker
// The next-pwa plugin has type compatibility issues with Next.js 16
export default withNextIntl(nextConfig);
