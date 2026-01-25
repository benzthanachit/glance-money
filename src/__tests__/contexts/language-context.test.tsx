import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/lib/contexts/language-context';

// Mock Next.js router
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace
  }),
  usePathname: () => '/dashboard'
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Test component that uses the language context
function TestComponent() {
  const { locale, setLocale, availableLocales } = useLanguage();
  
  return (
    <div>
      <div data-testid="current-locale">{locale}</div>
      <div data-testid="available-locales">{availableLocales.join(',')}</div>
      <button 
        data-testid="switch-to-en" 
        onClick={() => setLocale('en')}
      >
        Switch to English
      </button>
      <button 
        data-testid="switch-to-th" 
        onClick={() => setLocale('th')}
      >
        Switch to Thai
      </button>
    </div>
  );
}

describe('LanguageProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should provide initial locale', () => {
    render(
      <LanguageProvider initialLocale="th">
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-locale')).toHaveTextContent('th');
    expect(screen.getByTestId('available-locales')).toHaveTextContent('th,en');
  });

  it('should allow locale switching', async () => {
    render(
      <LanguageProvider initialLocale="th">
        <TestComponent />
      </LanguageProvider>
    );

    const switchButton = screen.getByTestId('switch-to-en');
    
    await act(async () => {
      switchButton.click();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('preferred-locale', 'en');
  });

  it('should handle invalid locale gracefully', async () => {
    const TestComponentWithInvalidLocale = () => {
      const { locale, setLocale } = useLanguage();
      
      const handleInvalidLocale = () => {
        setLocale('invalid' as any);
      };
      
      return (
        <div>
          <div data-testid="current-locale">{locale}</div>
          <button data-testid="invalid-locale" onClick={handleInvalidLocale}>
            Invalid Locale
          </button>
        </div>
      );
    };

    render(
      <LanguageProvider initialLocale="th">
        <TestComponentWithInvalidLocale />
      </LanguageProvider>
    );

    const invalidButton = screen.getByTestId('invalid-locale');
    
    await act(async () => {
      invalidButton.click();
    });

    expect(screen.getByTestId('current-locale')).toHaveTextContent('th');
  });

  it('should load saved locale preference from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    render(
      <LanguageProvider initialLocale="th">
        <TestComponent />
      </LanguageProvider>
    );

    // The component should eventually update to use the saved locale
    // Note: This test might need adjustment based on the actual implementation
    expect(localStorageMock.getItem).toHaveBeenCalledWith('preferred-locale');
  });
});