import { Transaction } from '@/lib/types/database';
import { FinancialSummary, CategorySummary, MonthlyData } from '@/lib/types';

/**
 * Calculate Net Status from transactions
 * Net_Status = Total Income - Total Expenses
 */
export function calculateNetStatus(transactions: Transaction[]): number {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return totalIncome - totalExpenses;
}

/**
 * Calculate total income from transactions
 */
export function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate total expenses from transactions
 */
export function calculateTotalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Generate category-based expense breakdown
 */
export function calculateCategoryBreakdown(transactions: Transaction[]): CategorySummary[] {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalExpenses = calculateTotalExpenses(transactions);

  // Group transactions by category
  const categoryGroups = expenseTransactions.reduce((groups, transaction) => {
    const category = transaction.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Calculate summary for each category
  return Object.entries(categoryGroups).map(([category, categoryTransactions]) => {
    const amount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
    
    return {
      category,
      amount,
      percentage,
      transactionCount: categoryTransactions.length
    };
  }).sort((a, b) => b.amount - a.amount); // Sort by amount descending
}

/**
 * Calculate monthly trend data
 */
export function calculateMonthlyTrend(transactions: Transaction[]): MonthlyData[] {
  // Group transactions by month
  const monthlyGroups = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Calculate monthly summaries
  return Object.entries(monthlyGroups)
    .map(([monthKey, monthTransactions]) => {
      const income = calculateTotalIncome(monthTransactions);
      const expenses = calculateTotalExpenses(monthTransactions);
      const netStatus = income - expenses;

      return {
        month: monthKey,
        income,
        expenses,
        netStatus
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month)); // Sort chronologically
}

/**
 * Generate complete financial summary
 */
export function calculateFinancialSummary(transactions: Transaction[]): FinancialSummary {
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const netStatus = calculateNetStatus(transactions);
  const categoryBreakdown = calculateCategoryBreakdown(transactions);
  const monthlyTrend = calculateMonthlyTrend(transactions);

  return {
    totalIncome,
    totalExpenses,
    netStatus,
    categoryBreakdown,
    monthlyTrend
  };
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] {
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
}

/**
 * Filter transactions by category
 */
export function filterTransactionsByCategory(
  transactions: Transaction[],
  category: string
): Transaction[] {
  return transactions.filter(transaction => transaction.category === category);
}

/**
 * Filter transactions by type
 */
export function filterTransactionsByType(
  transactions: Transaction[],
  type: 'income' | 'expense'
): Transaction[] {
  return transactions.filter(transaction => transaction.type === type);
}

/**
 * Get current month transactions
 */
export function getCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return filterTransactionsByDateRange(transactions, startOfMonth, endOfMonth);
}

/**
 * Get transactions for a specific month
 */
export function getMonthTransactions(
  transactions: Transaction[],
  year: number,
  month: number // 0-based (0 = January)
): Transaction[] {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  
  return filterTransactionsByDateRange(transactions, startOfMonth, endOfMonth);
}

/**
 * Determine theme based on Net Status
 * Positive = 'positive' (green theme)
 * Negative = 'negative' (red theme)
 */
export function getNetStatusTheme(netStatus: number): 'positive' | 'negative' {
  return netStatus >= 0 ? 'positive' : 'negative';
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    return newValue === 0 ? 0 : 100;
  }
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}

/**
 * Get spending trend (increasing/decreasing) compared to previous period
 */
export function getSpendingTrend(
  currentPeriodTransactions: Transaction[],
  previousPeriodTransactions: Transaction[]
): {
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  currentExpenses: number;
  previousExpenses: number;
} {
  const currentExpenses = calculateTotalExpenses(currentPeriodTransactions);
  const previousExpenses = calculateTotalExpenses(previousPeriodTransactions);
  const percentageChange = calculatePercentageChange(previousExpenses, currentExpenses);

  let trend: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(percentageChange) < 5) {
    trend = 'stable';
  } else if (percentageChange > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  return {
    trend,
    percentageChange,
    currentExpenses,
    previousExpenses
  };
}