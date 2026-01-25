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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <LanguageProvider initialLocale={locale as Locale}>
            <CurrencyProvider>
              <ThemeProvider>
                <AuthProvider>
                  {children}
                  <Toaster />
                  <OfflineToast />
                  <ServiceWorkerRegistration />
                </AuthProvider>
              </ThemeProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}