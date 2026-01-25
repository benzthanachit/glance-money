import { Locale } from '@/i18n/config';
import { Currency } from './formatting';

export interface UserPreferences {
  language: Locale;
  currency: Currency;
  theme: 'light' | 'dark' | 'system';
}

const PREFERENCES_KEY = 'glance-money-preferences';
const LOCALE_KEY = 'preferred-locale';
const CURRENCY_KEY = 'preferred-currency';

/**
 * Get user preferences from localStorage
 */
export function getStoredPreferences(): Partial<UserPreferences> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // Fallback to individual keys for backward compatibility
    const preferences: Partial<UserPreferences> = {};
    
    const locale = localStorage.getItem(LOCALE_KEY);
    if (locale && (locale === 'th' || locale === 'en')) {
      preferences.language = locale as Locale;
    }
    
    const currency = localStorage.getItem(CURRENCY_KEY);
    if (currency && ['THB', 'USD', 'EUR'].includes(currency)) {
      preferences.currency = currency as Currency;
    }
    
    return preferences;
  } catch (error) {
    console.warn('Failed to load preferences from localStorage:', error);
    return {};
  }
}

/**
 * Save user preferences to localStorage
 */
export function savePreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentPreferences = getStoredPreferences();
    const updatedPreferences = { ...currentPreferences, ...preferences };
    
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updatedPreferences));
    
    // Also save individual keys for backward compatibility
    if (preferences.language) {
      localStorage.setItem(LOCALE_KEY, preferences.language);
    }
    if (preferences.currency) {
      localStorage.setItem(CURRENCY_KEY, preferences.currency);
    }
  } catch (error) {
    console.warn('Failed to save preferences to localStorage:', error);
  }
}

/**
 * Get stored locale preference
 */
export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const preferences = getStoredPreferences();
    if (preferences.language) {
      return preferences.language;
    }
    
    // Fallback to individual key
    const locale = localStorage.getItem(LOCALE_KEY);
    if (locale && (locale === 'th' || locale === 'en')) {
      return locale as Locale;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to load locale from localStorage:', error);
    return null;
  }
}

/**
 * Save locale preference
 */
export function saveLocale(locale: Locale): void {
  savePreferences({ language: locale });
}

/**
 * Get stored currency preference
 */
export function getStoredCurrency(): Currency | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const preferences = getStoredPreferences();
    if (preferences.currency) {
      return preferences.currency;
    }
    
    // Fallback to individual key
    const currency = localStorage.getItem(CURRENCY_KEY);
    if (currency && ['THB', 'USD', 'EUR'].includes(currency)) {
      return currency as Currency;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to load currency from localStorage:', error);
    return null;
  }
}

/**
 * Save currency preference
 */
export function saveCurrency(currency: Currency): void {
  savePreferences({ currency });
}

/**
 * Clear all stored preferences
 */
export function clearPreferences(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(PREFERENCES_KEY);
    localStorage.removeItem(LOCALE_KEY);
    localStorage.removeItem(CURRENCY_KEY);
  } catch (error) {
    console.warn('Failed to clear preferences from localStorage:', error);
  }
}

/**
 * Get default preferences based on locale
 */
export function getDefaultPreferences(locale: Locale = 'th'): UserPreferences {
  return {
    language: locale,
    currency: locale === 'th' ? 'THB' : 'USD',
    theme: 'system'
  };
}