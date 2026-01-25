import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { LanguageProvider } from '@/lib/contexts/language-context'
import { CurrencyProvider } from '@/lib/contexts/currency-context'
import { ThemeProvider } from '@/lib/contexts/theme-context'
import { LanguageSettings } from '@/components/settings/language-settings'
import { CurrencySettings } from '@/components/settings/currency-settings'
import { ThemeSettings } from '@/components/settings/theme-settings'

// Mock next/navigation
const mockReplace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => '/th/settings',
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

const messages = {
  settings: {
    language: 'Language',
    currency: 'Currency',
    theme: 'Theme',
  },
  currency: {
    thb: 'Baht',
    usd: 'Dollar',
    eur: 'Euro',
  },
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider messages={messages} locale="en">
    <LanguageProvider initialLocale="en">
      <CurrencyProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </CurrencyProvider>
    </LanguageProvider>
  </NextIntlClientProvider>
)

describe('Settings Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('LanguageSettings', () => {
    it('should render language settings with current language', () => {
      render(
        <TestWrapper>
          <LanguageSettings />
        </TestWrapper>
      )

      expect(screen.getByText('Language')).toBeInTheDocument()
      expect(screen.getByText('Current Language')).toBeInTheDocument()
      expect(screen.getAllByText('English')).toHaveLength(2) // One in description, one in selector
    })

    it('should show language switcher', () => {
      render(
        <TestWrapper>
          <LanguageSettings />
        </TestWrapper>
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  describe('CurrencySettings', () => {
    it('should render currency settings with current currency', () => {
      render(
        <TestWrapper>
          <CurrencySettings />
        </TestWrapper>
      )

      expect(screen.getByText('Currency')).toBeInTheDocument()
      expect(screen.getByText('Current Currency')).toBeInTheDocument()
    })

    it('should show currency selector', () => {
      render(
        <TestWrapper>
          <CurrencySettings />
        </TestWrapper>
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  describe('ThemeSettings', () => {
    it('should render theme settings', () => {
      render(
        <TestWrapper>
          <ThemeSettings />
        </TestWrapper>
      )

      expect(screen.getByText('Theme')).toBeInTheDocument()
      expect(screen.getByText('System Theme')).toBeInTheDocument()
      expect(screen.getByText('Financial Status Theme')).toBeInTheDocument()
    })

    it('should show theme selector', () => {
      render(
        <TestWrapper>
          <ThemeSettings />
        </TestWrapper>
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should display current financial status theme', () => {
      render(
        <TestWrapper>
          <ThemeSettings />
        </TestWrapper>
      )

      expect(screen.getByText(/Current: Green \(Positive\)|Current: Red \(Negative\)/)).toBeInTheDocument()
    })
  })
})