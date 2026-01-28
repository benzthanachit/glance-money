import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import "../globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { LanguageProvider } from "@/lib/contexts/language-context";
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { CurrencyProvider } from "@/lib/contexts/currency-context";
import { locales, Locale } from '@/i18n/config';
import { Toaster } from "@/components/ui/sonner";
import OfflineToast from "@/components/ui/offline-toast";
import ServiceWorkerRegistration from "@/components/ui/service-worker-registration";
import PWAInstallPrompt from "@/components/ui/pwa-install-prompt";
import { PerformanceOptimizer, CriticalResources } from "@/components/ui/performance-optimizer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: false, // Only preload if needed
});

export const metadata: Metadata = {
  title: "Glance Money - The Simplest Expense Tracker",
  description: "Mobile-first expense tracking with visual financial status indicators",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Glance Money",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        {/* PWA meta tags */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192x192.png" />
        <meta name="theme-color" content="#10b981" />

        {/* Performance optimizations */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <PerformanceOptimizer>
          <CriticalResources
            images={["/icon-192x192.png", "/icon-512x512.png"]}
          />
          <NextIntlClientProvider messages={messages}>
            <LanguageProvider initialLocale={locale as Locale}>
              <CurrencyProvider>
                <ThemeProvider>
                  <AuthProvider>
                    {children}
                    <Toaster />
                    <OfflineToast />
                    <ServiceWorkerRegistration />
                    <PWAInstallPrompt />
                  </AuthProvider>
                </ThemeProvider>
              </CurrencyProvider>
            </LanguageProvider>
          </NextIntlClientProvider>
        </PerformanceOptimizer>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}