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
  private optimisticTransactions: Map<string, Transaction> = new Map();
  private isRefreshing: boolean = false;

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
      const allTransactions = this.mergeOptimisticTransactions(transactions);
      const summary = calculateFinancialSummary(allTransactions);
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
      const allTransactions = this.mergeOptimisticTransactions(transactions);
      const currentMonthTransactions = getCurrentMonthTransactions(allTransactions);
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
      const allTransactions = this.mergeOptimisticTransactions(transactions);
      const netStatus = calculateNetStatus(allTransactions);
      const theme = getNetStatusTheme(netStatus);
      
      const totalIncome = allTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = allTransactions
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
      const allTransactions = this.mergeOptimisticTransactions(transactions);
      return calculateCategoryBreakdown(allTransactions);
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
    if (this.isRefreshing) {
      return; // Prevent concurrent refreshes
    }

    try {
      this.isRefreshing = true;
      await this.getFinancialSummary();
    } catch (error) {
      console.error('Error refreshing financial data:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Calculate financial summary from provided transactions
   * Useful for optimistic updates
   */
  calculateSummaryFromTransactions(transactions: Transaction[]): FinancialSummary {
    const allTransactions = this.mergeOptimisticTransactions(transactions);
    const summary = calculateFinancialSummary(allTransactions);
    this.notifyListeners(summary);
    return summary;
  }

  /**
   * Add optimistic transaction for immediate UI updates
   */
  addOptimisticTransaction(transaction: Transaction): void {
    console.log('Adding optimistic transaction:', transaction);
    this.optimisticTransactions.set(transaction.id, transaction);
    
    // Immediately recalculate and notify with optimistic data
    if (this.currentSummary) {
      try {
        // Get current transactions and merge with optimistic ones
        // For immediate update, we'll use the current summary's implied transactions
        // In a real scenario, we'd need to maintain the transaction list
        const optimisticArray = Array.from(this.optimisticTransactions.values());
        const summary = calculateFinancialSummary(optimisticArray);
        this.notifyListeners(summary);
      } catch (error) {
        console.error('Error calculating optimistic summary:', error);
      }
    }
  }

  /**
   * Remove optimistic transaction (called when real update arrives)
   */
  removeOptimisticTransaction(transactionId: string): void {
    console.log('Removing optimistic transaction:', transactionId);
    this.optimisticTransactions.delete(transactionId);
  }

  /**
   * Update optimistic transaction
   */
  updateOptimisticTransaction(transaction: Transaction): void {
    console.log('Updating optimistic transaction:', transaction);
    this.optimisticTransactions.set(transaction.id, transaction);
    
    // Immediately recalculate and notify
    if (this.currentSummary) {
      try {
        const optimisticArray = Array.from(this.optimisticTransactions.values());
        const summary = calculateFinancialSummary(optimisticArray);
        this.notifyListeners(summary);
      } catch (error) {
        console.error('Error calculating optimistic summary after update:', error);
      }
    }
  }

  /**
   * Clear all optimistic transactions
   */
  clearOptimisticTransactions(): void {
    console.log('Clearing all optimistic transactions');
    this.optimisticTransactions.clear();
  }

  /**
   * Merge server transactions with optimistic transactions
   */
  private mergeOptimisticTransactions(serverTransactions: Transaction[]): Transaction[] {
    if (this.optimisticTransactions.size === 0) {
      return serverTransactions;
    }

    // Create a map of server transactions for efficient lookup
    const serverTransactionMap = new Map(serverTransactions.map(t => [t.id, t]));
    
    // Start with server transactions
    const mergedTransactions = [...serverTransactions];
    
    // Add optimistic transactions that don't exist on server yet
    this.optimisticTransactions.forEach((optimisticTransaction, id) => {
      if (!serverTransactionMap.has(id)) {
        mergedTransactions.push(optimisticTransaction);
      }
    });
    
    return mergedTransactions;
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