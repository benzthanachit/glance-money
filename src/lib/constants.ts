// Application constants for Glance Money

export const DEFAULT_CATEGORIES = [
  {
    id: 'food',
    name: 'Food',
    icon: '🍽️',
    type: 'expense' as const,
    isDefault: true,
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: '🚗',
    type: 'expense' as const,
    isDefault: true,
  },
  {
    id: 'fixed-cost',
    name: 'Fixed Cost',
    icon: '🏠',
    type: 'expense' as const,
    isDefault: true,
  },
  {
    id: 'dca',
    name: 'DCA',
    icon: '📈',
    type: 'expense' as const,
    isDefault: true,
  },
  {
    id: 'salary',
    name: 'Salary',
    icon: '💰',
    type: 'income' as const,
    isDefault: true,
  },
] as const;

export const SUPPORTED_LOCALES = ['th', 'en'] as const;
export const SUPPORTED_CURRENCIES = ['THB', 'USD', 'EUR'] as const;

export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export const TOUCH_TARGET_MIN_HEIGHT = 44; // px - minimum touch target height for mobile accessibility

export const PWA_CONFIG = {
  name: 'Glance Money - The Simplest Expense Tracker',
  shortName: 'Glance Money',
  description: 'Mobile-first expense tracking with visual financial status indicators',
  themeColor: '#10b981',
  backgroundColor: '#ffffff',
} as const;