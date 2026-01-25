'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/lib/contexts/language-context';
import { Locale } from '@/i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LanguageSwitcherProps {
  className?: string;
}

const languageNames: Record<Locale, { native: string; english: string }> = {
  th: { native: 'ไทย', english: 'Thai' },
  en: { native: 'English', english: 'English' },
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const t = useTranslations('settings');
  const { locale, setLocale, availableLocales } = useLanguage();

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale as Locale);
  };

  return (
    <div className={className}>
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('language')} />
        </SelectTrigger>
        <SelectContent>
          {availableLocales.map((lang) => (
            <SelectItem key={lang} value={lang}>
              <div className="flex items-center gap-2">
                <span>{languageNames[lang].native}</span>
                {lang !== locale && (
                  <span className="text-sm text-muted-foreground">
                    ({languageNames[lang].english})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Simple button version for mobile/compact layouts
export function LanguageSwitcherButton({ className }: LanguageSwitcherProps) {
  const { locale, setLocale, availableLocales } = useLanguage();

  const toggleLanguage = () => {
    const currentIndex = availableLocales.indexOf(locale);
    const nextIndex = (currentIndex + 1) % availableLocales.length;
    setLocale(availableLocales[nextIndex]);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground ${className}`}
    >
      <span className="text-sm font-medium">
        {languageNames[locale].native}
      </span>
      <span className="text-xs text-muted-foreground">
        {locale.toUpperCase()}
      </span>
    </button>
  );
}