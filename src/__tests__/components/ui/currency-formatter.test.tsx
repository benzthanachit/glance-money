import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CurrencyFormatter, CompactCurrencyFormatter } from '@/components/ui/currency-formatter';
import { LanguageProvider } from '@/lib/contexts/language-context';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  usePathname: () => '/th',
}));

const renderWithLanguageProvider = (component: React.ReactElement, locale: 'th' | 'en' = 'th') => {
  return render(
    <LanguageProvider initialLocale={locale}>
      {component}
    </LanguageProvider>
  );
};

describe('CurrencyFormatter', () => {
  it('should format Thai Baht correctly for Thai locale', () => {
    renderWithLanguageProvider(
      <CurrencyFormatter amount={1234.56} currency="THB" />
    );
    
    const formatter = screen.getByTestId('currency-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toContain('฿');
    expect(formatter.textContent).toContain('1,234.56');
  });

  it('should format USD correctly for English locale', () => {
    renderWithLanguageProvider(
      <CurrencyFormatter amount={1234.56} currency="USD" />,
      'en'
    );
    
    const formatter = screen.getByTestId('currency-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toContain('$');
  });

  it('should hide currency symbol when showSymbol is false', () => {
    renderWithLanguageProvider(
      <CurrencyFormatter amount={1234.56} currency="THB" showSymbol={false} />
    );
    
    const formatter = screen.getByTestId('currency-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).not.toContain('฿');
    expect(formatter.textContent).toContain('1,234.56');
  });

  it('should apply custom className', () => {
    renderWithLanguageProvider(
      <CurrencyFormatter amount={1234.56} currency="THB" className="custom-class" />
    );
    
    const formatter = screen.getByTestId('currency-formatter');
    expect(formatter).toHaveClass('custom-class');
  });
});

describe('CompactCurrencyFormatter', () => {
  it('should format large numbers in compact notation', () => {
    renderWithLanguageProvider(
      <CompactCurrencyFormatter amount={1234567} currency="THB" />
    );
    
    const formatter = screen.getByTestId('compact-currency-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toContain('฿');
    // Should show compact format like ฿1.2M or similar
    expect(formatter.textContent).toMatch(/฿\d+(\.\d+)?[KMB]?/);
  });

  it('should format small numbers normally', () => {
    renderWithLanguageProvider(
      <CompactCurrencyFormatter amount={123} currency="THB" />
    );
    
    const formatter = screen.getByTestId('compact-currency-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toContain('฿123');
  });
});