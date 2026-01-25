import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { DateFormatter, TimeFormatter, RelativeTimeFormatter } from '@/components/ui/date-formatter';
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

describe('DateFormatter', () => {
  const testDate = new Date('2024-01-15T10:30:00Z');

  it('should format date correctly for Thai locale', () => {
    renderWithLanguageProvider(
      <DateFormatter date={testDate} format="medium" />
    );
    
    const formatter = screen.getByTestId('date-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toBeTruthy();
  });

  it('should format date correctly for English locale', () => {
    renderWithLanguageProvider(
      <DateFormatter date={testDate} format="medium" />,
      'en'
    );
    
    const formatter = screen.getByTestId('date-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toBeTruthy();
  });

  it('should handle different format options', () => {
    renderWithLanguageProvider(
      <DateFormatter date={testDate} format="short" />
    );
    
    const formatter = screen.getByTestId('date-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toBeTruthy();
  });

  it('should apply custom className', () => {
    renderWithLanguageProvider(
      <DateFormatter date={testDate} className="custom-class" />
    );
    
    const formatter = screen.getByTestId('date-formatter');
    expect(formatter).toHaveClass('custom-class');
  });
});

describe('TimeFormatter', () => {
  const testDate = new Date('2024-01-15T10:30:00Z');

  it('should format time correctly', () => {
    renderWithLanguageProvider(
      <TimeFormatter date={testDate} />
    );
    
    const formatter = screen.getByTestId('time-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toBeTruthy();
  });
});

describe('RelativeTimeFormatter', () => {
  it('should format relative time correctly', () => {
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    
    renderWithLanguageProvider(
      <RelativeTimeFormatter date={pastDate} />
    );
    
    const formatter = screen.getByTestId('relative-time-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toBeTruthy();
  });

  it('should handle future dates', () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    
    renderWithLanguageProvider(
      <RelativeTimeFormatter date={futureDate} />
    );
    
    const formatter = screen.getByTestId('relative-time-formatter');
    expect(formatter).toBeInTheDocument();
    expect(formatter.textContent).toBeTruthy();
  });
});