import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

const nextConfig: NextConfig = {
  turbopack: {}, // Enable Turbopack explicitly
};

export default withNextIntl(nextConfig);
