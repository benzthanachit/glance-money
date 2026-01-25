'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Locale, locales, defaultLocale } from '@/i18n/config';
import { getStoredLocale, saveLocale } from '@/lib/utils/preferences';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  availableLocales: readonly Locale[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLocale: Locale;
}

export function LanguageProvider({ children, initialLocale }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();
  const pathname = usePathname();

  // Load saved locale preference from localStorage
  useEffect(() => {
    const savedLocale = getStoredLocale();
    if (savedLocale && locales.includes(savedLocale) && savedLocale !== initialLocale) {
      setLocaleState(savedLocale);
      // Redirect to the saved locale if different from current
      const newPathname = pathname.replace(`/${initialLocale}`, `/${savedLocale}`);
      router.replace(newPathname);
    }
  }, [initialLocale, pathname, router]);

  const setLocale = (newLocale: Locale) => {
    if (!locales.includes(newLocale)) return;
    
    setLocaleState(newLocale);
    
    // Save preference to localStorage using preferences utility
    saveLocale(newLocale);
    
    // Update URL to reflect new locale
    const currentPathname = pathname;
    let newPathname: string;
    
    // Check if current pathname has a locale prefix
    const currentLocale = currentPathname.split('/')[1];
    if (locales.includes(currentLocale as Locale)) {
      // Replace existing locale
      newPathname = currentPathname.replace(`/${currentLocale}`, `/${newLocale}`);
    } else {
      // Add locale prefix
      newPathname = `/${newLocale}${currentPathname}`;
    }
    
    // Handle default locale (no prefix needed)
    if (newLocale === defaultLocale) {
      newPathname = newPathname.replace(`/${defaultLocale}`, '') || '/';
    }
    
    router.replace(newPathname);
  };

  const value: LanguageContextType = {
    locale,
    setLocale,
    availableLocales: locales,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useLocale() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LanguageProvider');
  }
  return context.locale;
}