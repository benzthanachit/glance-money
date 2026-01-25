import {
  calculateNetStatus,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateCategoryBreakdown,
  calculateMonthlyTrend,
  calculateFinancialSummary,
  getNetStatusTheme,
  calculatePercentageChange,
  getCurrentMonthTransactions,
  filterTransactionsByCategory,
  filterTransactionsByType,
  getSpendingTrend
} from '@/lib/utils/financial';
import { Transaction } from '@/lib/types/database';

// Mock transaction data for testing
const mockTransactions: Transaction[] = [
  {
    id: '1',
    user_id: 'user1',
    amount: 5000,
    type: 'income',
    category: 'Salary',
    description: 'Monthly salary',
    date: '2024-01-15',
    is_recurring: true,
    recurring_parent_id: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    user_id: 'user1',
    amount: 1200,
    type: 'expense',
    category: 'Food',
    description: 'Groceries',
    date: '2024-01-16',
    is_recurring: false,
    recurring_parent_id: null,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  },
  {
    id: '3',
    user_id: 'user1',
    amount: 800,
    type: 'expense',
    category: 'Transport',
    description: 'Gas',
    date: '2024-01-17',
    is_recurring: false,
    recurring_parent_id: null,
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z'
  },
  {
    id: '4',
    user_id: 'user1',
    amount: 2000,
    type: 'expense',
    category: 'Fixed Cost',
    description: 'Rent',
    date: '2024-01-01',
    is_recurring: true,
    recurring_parent_id: null,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '5',
    user_id: 'user1',
    amount: 500,
    type: 'expense',
    category: 'Food',
    description: 'Restaurant',
    date: '2024-01-20',
    is_recurring: false,
    recurring_parent_id: null,
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z'
  }
];

describe('Financial Calculations', () => {
  describe('calculateNetStatus', () => {
    it('should calculate net status correctly', () => {
      const netStatus = calculateNetStatus(mockTransactions);
      // Income: 5000, Expenses: 1200 + 800 + 2000 + 500 = 4500
      // Net Status: 5000 - 4500 = 500
      expect(netStatus).toBe(500);
    });

    it('should return 0 for empty transactions', () => {
      const netStatus = calculateNetStatus([]);
      expect(netStatus).toBe(0);
    });

    it('should handle negative net status', () => {
      const expenseOnlyTransactions = mockTransactions.filter(t => t.type === 'expense');
      const netStatus = calculateNetStatus(expenseOnlyTransactions);
      expect(netStatus).toBe(-4500);
    });
  });

  describe('calculateTotalIncome', () => {
    it('should calculate total income correctly', () => {
      const totalIncome = calculateTotalIncome(mockTransactions);
      expect(totalIncome).toBe(5000);
    });

    it('should return 0 when no income transactions', () => {
      const expenseOnlyTransactions = mockTransactions.filter(t => t.type === 'expense');
      const totalIncome = calculateTotalIncome(expenseOnlyTransactions);
      expect(totalIncome).toBe(0);
    });
  });

  describe('calculateTotalExpenses', () => {
    it('should calculate total expenses correctly', () => {
      const totalExpenses = calculateTotalExpenses(mockTransactions);
      expect(totalExpenses).toBe(4500);
    });

    it('should return 0 when no expense transactions', () => {
      const incomeOnlyTransactions = mockTransactions.filter(t => t.type === 'income');
      const totalExpenses = calculateTotalExpenses(incomeOnlyTransactions);
      expect(totalExpenses).toBe(0);
    });
  });

  describe('calculateCategoryBreakdown', () => {
    it('should calculate category breakdown correctly', () => {
      const breakdown = calculateCategoryBreakdown(mockTransactions);
      
      expect(breakdown).toHaveLength(3);
      
      // Should be sorted by amount descending
      expect(breakdown[0].category).toBe('Fixed Cost');
      expect(breakdown[0].amount).toBe(2000);
      expect(breakdown[0].percentage).toBeCloseTo(44.44, 2);
      expect(breakdown[0].transactionCount).toBe(1);

      expect(breakdown[1].category).toBe('Food');
      expect(breakdown[1].amount).toBe(1700); // 1200 + 500
      expect(breakdown[1].percentage).toBeCloseTo(37.78, 2);
      expect(breakdown[1].transactionCount).toBe(2);

      expect(breakdown[2].category).toBe('Transport');
      expect(breakdown[2].amount).toBe(800);
      expect(breakdown[2].percentage).toBeCloseTo(17.78, 2);
      expect(breakdown[2].transactionCount).toBe(1);
    });

    it('should return empty array for income-only transactions', () => {
      const incomeOnlyTransactions = mockTransactions.filter(t => t.type === 'income');
      const breakdown = calculateCategoryBreakdown(incomeOnlyTransactions);
      expect(breakdown).toHaveLength(0);
    });
  });

  describe('calculateMonthlyTrend', () => {
    it('should calculate monthly trend correctly', () => {
      const trend = calculateMonthlyTrend(mockTransactions);
      
      expect(trend).toHaveLength(1);
      expect(trend[0].month).toBe('2024-01');
      expect(trend[0].income).toBe(5000);
      expect(trend[0].expenses).toBe(4500);
      expect(trend[0].netStatus).toBe(500);
    });

    it('should handle multiple months', () => {
      const multiMonthTransactions = [
        ...mockTransactions,
        {
          id: '6',
          user_id: 'user1',
          amount: 3000,
          type: 'income' as const,
          category: 'Salary',
          description: 'February salary',
          date: '2024-02-15',
          is_recurring: true,
          recurring_parent_id: null,
          created_at: '2024-02-15T10:00:00Z',
          updated_at: '2024-02-15T10:00:00Z'
        }
      ];

      const trend = calculateMonthlyTrend(multiMonthTransactions);
      expect(trend).toHaveLength(2);
      expect(trend[0].month).toBe('2024-01');
      expect(trend[1].month).toBe('2024-02');
    });
  });

  describe('calculateFinancialSummary', () => {
    it('should calculate complete financial summary', () => {
      const summary = calculateFinancialSummary(mockTransactions);
      
      expect(summary.totalIncome).toBe(5000);
      expect(summary.totalExpenses).toBe(4500);
      expect(summary.netStatus).toBe(500);
      expect(summary.categoryBreakdown).toHaveLength(3);
      expect(summary.monthlyTrend).toHaveLength(1);
    });
  });

  describe('getNetStatusTheme', () => {
    it('should return positive theme for positive net status', () => {
      expect(getNetStatusTheme(500)).toBe('positive');
      expect(getNetStatusTheme(0)).toBe('positive');
    });

    it('should return negative theme for negative net status', () => {
      expect(getNetStatusTheme(-100)).toBe('negative');
    });
  });

  describe('calculatePercentageChange', () => {
    it('should calculate percentage change correctly', () => {
      expect(calculatePercentageChange(100, 150)).toBe(50);
      expect(calculatePercentageChange(200, 100)).toBe(-50);
      expect(calculatePercentageChange(100, 100)).toBe(0);
    });

    it('should handle zero old value', () => {
      expect(calculatePercentageChange(0, 100)).toBe(100);
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });
  });

  describe('filterTransactionsByCategory', () => {
    it('should filter transactions by category', () => {
      const foodTransactions = filterTransactionsByCategory(mockTransactions, 'Food');
      expect(foodTransactions).toHaveLength(2);
      expect(foodTransactions.every(t => t.category === 'Food')).toBe(true);
    });
  });

  describe('filterTransactionsByType', () => {
    it('should filter transactions by type', () => {
      const incomeTransactions = filterTransactionsByType(mockTransactions, 'income');
      expect(incomeTransactions).toHaveLength(1);
      expect(incomeTransactions.every(t => t.type === 'income')).toBe(true);

      const expenseTransactions = filterTransactionsByType(mockTransactions, 'expense');
      expect(expenseTransactions).toHaveLength(4);
      expect(expenseTransactions.every(t => t.type === 'expense')).toBe(true);
    });
  });

  describe('getSpendingTrend', () => {
    it('should calculate spending trend correctly', () => {
      const currentTransactions = mockTransactions.filter(t => t.type === 'expense');
      const previousTransactions = [
        {
          id: '7',
          user_id: 'user1',
          amount: 3000,
          type: 'expense' as const,
          category: 'Food',
          description: 'Previous month expenses',
          date: '2023-12-15',
          is_recurring: false,
          recurring_parent_id: null,
          created_at: '2023-12-15T10:00:00Z',
          updated_at: '2023-12-15T10:00:00Z'
        }
      ];

      const trend = getSpendingTrend(currentTransactions, previousTransactions);
      
      expect(trend.currentExpenses).toBe(4500);
      expect(trend.previousExpenses).toBe(3000);
      expect(trend.trend).toBe('increasing');
      expect(trend.percentageChange).toBe(50);
    });

    it('should identify stable trend for small changes', () => {
      const currentTransactions = mockTransactions.filter(t => t.type === 'expense');
      const previousTransactions = [
        {
          id: '8',
          user_id: 'user1',
          amount: 4400,
          type: 'expense' as const,
          category: 'Food',
          description: 'Previous month expenses',
          date: '2023-12-15',
          is_recurring: false,
          recurring_parent_id: null,
          created_at: '2023-12-15T10:00:00Z',
          updated_at: '2023-12-15T10:00:00Z'
        }
      ];

      const trend = getSpendingTrend(currentTransactions, previousTransactions);
      expect(trend.trend).toBe('stable');
    });
  });
});