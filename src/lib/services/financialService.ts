import { Transaction } from '@/lib/types/database';
import { FinancialSummary, CategorySummary } from '@/lib/types';
import { 
  calculateFinancialSummary,
  calculateNetStatus,
  calculateCategoryBreakdown,
  getCurrentMonthTransactions,
  getNetStatusTheme
} from '@/lib/utils/financial';
import { transactionService } from './transactionService';

/**
 * Service for managing financial calculations and real-time updates
 */
class FinancialService {
  private listeners: Set<(summary: FinancialSummary) => void> = new Set();
  private currentSummary: FinancialSummary | null = null;

  /**
   * Subscribe to financial summary updates
   */
  subscribe(callback: (summary: FinancialSummary) => void): () => void {
    this.listeners.add(callback);
    
    // If we have current data, immediately call the callback
    if (this.currentSummary) {
      callback(this.currentSummary);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of financial summary updates
   */
  private notifyListeners(summary: FinancialSummary): void {
    this.currentSummary = summary;
    this.listeners.forEach(callback => callback(summary));
  }

  /**
   * Calculate and return current financial summary
   */
  async getFinancialSummary(): Promise<FinancialSummary> {
    try {
      const transactions = await transactionService.getTransactions();
      const summary = calculateFinancialSummary(transactions);
      this.notifyListeners(summary);
      return summary;
    } catch (error) {
      console.error('Error calculating financial summary:', error);
      throw error;
    }
  }

  /**
   * Get current month financial summary
   */
  async getCurrentMonthSummary(): Promise<FinancialSummary> {
    try {
      const transactions = await transactionService.getTransactions();
      const currentMonthTransactions = getCurrentMonthTransactions(transactions);
      const summary = calculateFinancialSummary(currentMonthTransactions);
      return summary;
    } catch (error) {
      console.error('Error calculating current month summary:', error);
      throw error;
    }
  }

  /**
   * Get Net Status and theme for UI
   */
  async getNetStatusData(): Promise<{
    netStatus: number;
    theme: 'positive' | 'negative';
    totalIncome: number;
    totalExpenses: number;
  }> {
    try {
      const transactions = await transactionService.getTransactions();
      const netStatus = calculateNetStatus(transactions);
      const theme = getNetStatusTheme(netStatus);
      
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        netStatus,
        theme,
        totalIncome,
        totalExpenses
      };
    } catch (error) {
      console.error('Error calculating net status:', error);
      throw error;
    }
  }

  /**
   * Get category breakdown for expenses
   */
  async getCategoryBreakdown(): Promise<CategorySummary[]> {
    try {
      const transactions = await transactionService.getTransactions();
      return calculateCategoryBreakdown(transactions);
    } catch (error) {
      console.error('Error calculating category breakdown:', error);
      throw error;
    }
  }

  /**
   * Refresh financial data and notify listeners
   * Call this after any transaction changes
   */
  async refresh(): Promise<void> {
    try {
      await this.getFinancialSummary();
    } catch (error) {
      console.error('Error refreshing financial data:', error);
      throw error;
    }
  }

  /**
   * Calculate financial summary from provided transactions
   * Useful for optimistic updates
   */
  calculateSummaryFromTransactions(transactions: Transaction[]): FinancialSummary {
    const summary = calculateFinancialSummary(transactions);
    this.notifyListeners(summary);
    return summary;
  }

  /**
   * Get the current cached summary without making API calls
   */
  getCurrentSummary(): FinancialSummary | null {
    return this.currentSummary;
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this.currentSummary = null;
  }
}

// Export singleton instance
export const financialService = new FinancialService();