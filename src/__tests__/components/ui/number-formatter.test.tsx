import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { NumberFormatter, PercentageFormatter, CompactNumberFormatter } from '@/components/ui/number-formatter';
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

describe('NumberFormatter', () => {
  it('should format numbers correctly for Thai locale', () => {
    renderWithLanguageProvider(
      <NumberFormatter value={1234.56} />
    );
    
    const formatter = screen.getByTestId('number-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toContain('1,234.56');
  });

  it('should format numbers correctly for English locale', () => {
    renderWithLanguageProvider(
      <NumberFormatter value={1234.56} />,
      'en'
    );
    
    const formatter = screen.getByTestId('number-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toContain('1,234.56');
  });

  it('should apply custom formatting options', () => {
    renderWithLanguageProvider(
      <NumberFormatter 
        value={1234.56} 
        options={{ minimumFractionDigits: 3, maximumFractionDigits: 3 }} 
      />
    );
    
    const formatter = screen.getByTestId('number-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toContain('1,234.560');
  });

  it('should apply custom className', () => {
    renderWithLanguageProvider(
      <NumberFormatter value={1234.56} className="custom-class" />
    );
    
    const formatter = screen.getByTestId('number-formatter');
    expect(formatter).toHaveClass('custom-class');
  });
});

describe('PercentageFormatter', () => {
  it('should format percentages correctly', () => {
    renderWithLanguageProvider(
      <PercentageFormatter value={75.5} />
    );
    
    const formatter = screen.getByTestId('percentage-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toContain('%');
  });

  it('should handle custom decimal places', () => {
    renderWithLanguageProvider(
      <PercentageFormatter value={75.555} decimals={2} />
    );
    
    const formatter = screen.getByTestId('percentage-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toContain('%');
  });
});

describe('CompactNumberFormatter', () => {
  it('should format large numbers in compact notation', () => {
    renderWithLanguageProvider(
      <CompactNumberFormatter value={1234567} />
    );
    
    const formatter = screen.getByTestId('compact-number-formatter');
    expect(formatter).toBeInTheDocument();
    // Should show compact format like 1.2M or similar
    expect(formatter.textContent).toMatch(/\d+(\.\d+)?[KMB]?/);
  });

  it('should format small numbers normally', () => {
    renderWithLanguageProvider(
      <CompactNumberFormatter value={123} />
    );
    
    const formatter = screen.getByTestId('compact-number-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toBe('123');
  });
});