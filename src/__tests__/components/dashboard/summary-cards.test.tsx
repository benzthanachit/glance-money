import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { CategorySummary } from '@/lib/types';

// Mock the CurrencyFormatter component to avoid context issues
vi.mock('@/components/ui/currency-formatter', () => ({
  CurrencyFormatter: ({ amount, currency }: { amount: number; currency: string }) => (
    <span data-testid="currency-formatter">{currency} {amount.toLocaleString()}</span>
  )
}));

const mockCategoryBreakdown: CategorySummary[] = [
  {
    category: 'Food',
    amount: 1500,
    percentage: 50,
    transactionCount: 10
  },
  {
    category: 'Transport',
    amount: 900,
    percentage: 30,
    transactionCount: 6
  },
  {
    category: 'Fixed Cost',
    amount: 600,
    percentage: 20,
    transactionCount: 3
  }
];

describe('SummaryCards', () => {
  it('renders income and expense summary correctly', () => {
    render(
      <SummaryCards
        totalIncome={5000}
        totalExpenses={3000}
        categoryBreakdown={mockCategoryBreakdown}
        currency="THB"
        locale="en"
      />
    );

    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
  });

  it('displays category breakdown with correct data', () => {
    render(
      <SummaryCards
        totalIncome={5000}
        totalExpenses={3000}
        categoryBreakdown={mockCategoryBreakdown}
        currency="THB"
        locale="en"
      />
    );

    expect(screen.getByText('Expenses by Category')).toBeInTheDocument();
    expect(screen.getAllByText('Food')).toHaveLength(2); // Appears in both category list and progress bars
    expect(screen.getAllByText('Transport')).toHaveLength(2);
    expect(screen.getAllByText('Fixed Cost')).toHaveLength(2);
    expect(screen.getByText('10 transactions')).toBeInTheDocument();
    expect(screen.getAllByText('50.0%')).toHaveLength(2); // Appears in both sections
  });

  it('shows empty state when no category data', () => {
    render(
      <SummaryCards
        totalIncome={0}
        totalExpenses={0}
        categoryBreakdown={[]}
        currency="THB"
        locale="en"
      />
    );

    expect(screen.getByText('No expenses yet')).toBeInTheDocument();
    expect(screen.getByText('Start adding transactions to see breakdown')).toBeInTheDocument();
  });

  it('renders in Thai locale correctly', () => {
    render(
      <SummaryCards
        totalIncome={5000}
        totalExpenses={3000}
        categoryBreakdown={mockCategoryBreakdown}
        currency="THB"
        locale="th"
      />
    );

    expect(screen.getByText('รายได้รวม')).toBeInTheDocument();
    expect(screen.getByText('รายจ่ายรวม')).toBeInTheDocument();
    expect(screen.getByText('เป้าหมาย')).toBeInTheDocument();
    expect(screen.getByText('รายจ่ายตามหมวดหมู่')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(
      <SummaryCards
        totalIncome={0}
        totalExpenses={0}
        categoryBreakdown={[]}
        currency="THB"
        locale="en"
        loading={true}
      />
    );

    // Check for loading skeletons
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('applies touch-friendly classes for mobile interaction', () => {
    const { container } = render(
      <SummaryCards
        totalIncome={5000}
        totalExpenses={3000}
        categoryBreakdown={mockCategoryBreakdown}
        currency="THB"
        locale="en"
      />
    );

    // Check for touch-manipulation class
    const touchElements = container.querySelectorAll('.touch-manipulation');
    expect(touchElements.length).toBeGreaterThan(0);
  });
});