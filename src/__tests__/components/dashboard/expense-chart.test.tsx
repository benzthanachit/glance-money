import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { CategorySummary } from '@/lib/types';

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

describe('ExpenseChart', () => {
  it('renders chart with category data', () => {
    render(
      <ExpenseChart
        categoryBreakdown={mockCategoryBreakdown}
        totalExpenses={3000}
        locale="en"
      />
    );

    expect(screen.getByText('Expense Chart')).toBeInTheDocument();
    // Use getAllByText for elements that appear multiple times
    expect(screen.getAllByText('Food')).toHaveLength(2); // Legend and details section
    expect(screen.getAllByText('Transport')).toHaveLength(2);
    expect(screen.getAllByText('Fixed Cost')).toHaveLength(2);
    expect(screen.getAllByText('50.0%')).toHaveLength(2);
    expect(screen.getAllByText('30.0%')).toHaveLength(2);
    expect(screen.getAllByText('20.0%')).toHaveLength(2);
  });

  it('shows empty state when no data', () => {
    render(
      <ExpenseChart
        categoryBreakdown={[]}
        totalExpenses={0}
        locale="en"
      />
    );

    expect(screen.getByText('No expense data available')).toBeInTheDocument();
    expect(screen.getByText('Add transactions to see chart')).toBeInTheDocument();
  });

  it('renders in Thai locale correctly', () => {
    render(
      <ExpenseChart
        categoryBreakdown={mockCategoryBreakdown}
        totalExpenses={3000}
        locale="th"
      />
    );

    expect(screen.getByText('แผนภูมิรายจ่าย')).toBeInTheDocument();
    expect(screen.getByText('รวม')).toBeInTheDocument();
    expect(screen.getByText('หมวดหมู่')).toBeInTheDocument();
    expect(screen.getByText('รายละเอียด')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(
      <ExpenseChart
        categoryBreakdown={[]}
        totalExpenses={0}
        locale="en"
        loading={true}
      />
    );

    // Check for loading skeletons
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('displays center text with category count', () => {
    render(
      <ExpenseChart
        categoryBreakdown={mockCategoryBreakdown}
        totalExpenses={3000}
        locale="en"
      />
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Number of categories
    expect(screen.getByText('categories')).toBeInTheDocument();
  });

  it('applies touch-friendly classes for mobile interaction', () => {
    const { container } = render(
      <ExpenseChart
        categoryBreakdown={mockCategoryBreakdown}
        totalExpenses={3000}
        locale="en"
      />
    );

    // Check for touch-manipulation class
    const touchElements = container.querySelectorAll('.touch-manipulation');
    expect(touchElements.length).toBeGreaterThan(0);
  });
});