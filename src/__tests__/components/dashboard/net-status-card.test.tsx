import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { NetStatusCard } from '@/components/dashboard/net-status-card';
import { ThemeProvider } from '@/lib/contexts/theme-context';

// Mock the currency formatter
vi.mock('@/components/ui/currency-formatter', () => ({
  CurrencyFormatter: ({ amount, showSign }: { amount: number; showSign?: boolean }) => (
    <span>{showSign && amount >= 0 ? '+' : ''}฿{amount.toFixed(2)}</span>
  ),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('NetStatusCard', () => {
  const defaultProps = {
    netAmount: 1000,
    currency: 'THB',
    locale: 'th' as const,
    theme: 'positive' as const,
    totalIncome: 5000,
    totalExpenses: 4000,
  };

  it('renders net status card with positive theme', () => {
    renderWithTheme(<NetStatusCard {...defaultProps} />);
    
    expect(screen.getByText('สถานะการเงิน')).toBeInTheDocument();
    expect(screen.getByText('+฿1000.00')).toBeInTheDocument();
    expect(screen.getByText('สถานะการเงินดี')).toBeInTheDocument();
  });

  it('renders net status card with negative theme', () => {
    const negativeProps = {
      ...defaultProps,
      netAmount: -500,
      theme: 'negative' as const,
    };

    renderWithTheme(<NetStatusCard {...negativeProps} />);
    
    expect(screen.getByText('฿-500.00')).toBeInTheDocument();
    expect(screen.getByText('สถานะการเงินติดลบ')).toBeInTheDocument();
  });

  it('renders in English locale', () => {
    const englishProps = {
      ...defaultProps,
      locale: 'en' as const,
    };

    renderWithTheme(<NetStatusCard {...englishProps} />);
    
    expect(screen.getByText('Net Status')).toBeInTheDocument();
    expect(screen.getByText('Positive Financial Status')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const loadingProps = {
      ...defaultProps,
      loading: true,
    };

    renderWithTheme(<NetStatusCard {...loadingProps} />);
    
    expect(screen.getByText('สถานะการเงิน')).toBeInTheDocument();
    // Check for loading skeleton elements
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays income and expenses breakdown', () => {
    renderWithTheme(<NetStatusCard {...defaultProps} />);
    
    expect(screen.getByText('รายได้')).toBeInTheDocument();
    expect(screen.getByText('รายจ่าย')).toBeInTheDocument();
    expect(screen.getByText('฿5000.00')).toBeInTheDocument();
    expect(screen.getByText('฿4000.00')).toBeInTheDocument();
  });

  it('shows balanced status for zero net amount', () => {
    const balancedProps = {
      ...defaultProps,
      netAmount: 0,
      totalIncome: 1000,
      totalExpenses: 1000,
    };

    renderWithTheme(<NetStatusCard {...balancedProps} />);
    
    expect(screen.getByText('สถานะการเงินสมดุล')).toBeInTheDocument();
  });
});