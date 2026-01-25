'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type NetStatusTheme = 'positive' | 'negative';

interface ThemeContextType {
  netStatusTheme: NetStatusTheme;
  setNetStatusTheme: (theme: NetStatusTheme) => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: NetStatusTheme;
}

export function ThemeProvider({ children, defaultTheme = 'positive' }: ThemeProviderProps) {
  const [netStatusTheme, setNetStatusTheme] = useState<NetStatusTheme>(defaultTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleThemeChange = (theme: NetStatusTheme) => {
    if (theme !== netStatusTheme) {
      setIsTransitioning(true);
      setNetStatusTheme(theme);
      
      // Reset transition state after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300); // Match CSS transition duration
    }
  };

  useEffect(() => {
    // Apply theme to document root for CSS custom properties
    const root = document.documentElement;
    
    if (netStatusTheme === 'positive') {
      root.classList.remove('theme-negative');
      root.classList.add('theme-positive');
    } else {
      root.classList.remove('theme-positive');
      root.classList.add('theme-negative');
    }
  }, [netStatusTheme]);

  return (
    <ThemeContext.Provider
      value={{
        netStatusTheme,
        setNetStatusTheme: handleThemeChange,
        isTransitioning,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useNetStatusTheme() {
  const { netStatusTheme, setNetStatusTheme } = useTheme();
  return { netStatusTheme, setNetStatusTheme };
}