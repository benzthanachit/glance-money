'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency } from '@/lib/utils/formatting';
import { getStoredCurrency, saveCurrency } from '@/lib/utils/preferences';
import { useLocale } from './language-context';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  availableCurrencies: Currency[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: React.ReactNode;
  defaultCurrency?: Currency;
}

export function CurrencyProvider({ children, defaultCurrency }: CurrencyProviderProps) {
  const locale = useLocale();
  
  // Set default currency based on locale if not provided
  const getDefaultCurrency = (): Currency => {
    if (defaultCurrency) return defaultCurrency;
    return locale === 'th' ? 'THB' : 'USD';
  };

  const [currency, setCurrencyState] = useState<Currency>(getDefaultCurrency());

  // Load saved currency preference from localStorage
  useEffect(() => {
    const savedCurrency = getStoredCurrency();
    if (savedCurrency) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  // Update default currency when locale changes (if no saved preference)
  useEffect(() => {
    const savedCurrency = getStoredCurrency();
    if (!savedCurrency) {
      const newDefaultCurrency = getDefaultCurrency();
      setCurrencyState(newDefaultCurrency);
    }
  }, [locale, defaultCurrency]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    saveCurrency(newCurrency);
  };

  const availableCurrencies: Currency[] = ['THB', 'USD', 'EUR'];

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    availableCurrencies,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

export default CurrencyProvider;