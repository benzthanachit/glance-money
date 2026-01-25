import { vi, describe, it, expect, beforeEach } from 'vitest';
import { financialService } from '@/lib/services/financialService';
import { transactionService } from '@/lib/services/transactionService';
import { Transaction } from '@/lib/types/database';

// Mock the transaction service
vi.mock('@/lib/services/transactionService');

const mockTransactionService = vi.mocked(transactionService);

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
    id: '3',
    user_id: 'user1',
    amount: 1500,
    type: 'expense',
    category: 'Food',
    description: 'Groceries',
    date: '2024-01-16',
    is_recurring: false,
    recurring_parent_id: null,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  }
];

describe('FinancialService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    financialService.clearCache();
  });

  describe('getFinancialSummary', () => {
    it('should calculate and return financial summary', async () => {
      mockTransactionService.getTransactions.mockResolvedValue(mockTransactions);

      const summary = await financialService.getFinancialSummary();

      expect(summary.totalIncome).toBe(5000);
      expect(summary.totalExpenses).toBe(3500);
      expect(summary.netStatus).toBe(1500);
      expect(summary.categoryBreakdown).toHaveLength(2);
      expect(mockTransactionService.getTransactions).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      mockTransactionService.getTransactions.mockRejectedValue(new Error('API Error'));

      await expect(financialService.getFinancialSummary()).rejects.toThrow('API Error');
    });
  });

  describe('getNetStatusData', () => {
    it('should return net status data with theme', async () => {
      mockTransactionService.getTransactions.mockResolvedValue(mockTransactions);

      const netStatusData = await financialService.getNetStatusData();

      expect(netStatusData.netStatus).toBe(1500);
      expect(netStatusData.theme).toBe('positive');
      expect(netStatusData.totalIncome).toBe(5000);
      expect(netStatusData.totalExpenses).toBe(3500);
    });

    it('should return negative theme for negative net status', async () => {
      const negativeTransactions = mockTransactions.filter(t => t.type === 'expense');
      mockTransactionService.getTransactions.mockResolvedValue(negativeTransactions);

      const netStatusData = await financialService.getNetStatusData();

      expect(netStatusData.netStatus).toBe(-3500);
      expect(netStatusData.theme).toBe('negative');
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should return category breakdown', async () => {
      mockTransactionService.getTransactions.mockResolvedValue(mockTransactions);

      const breakdown = await financialService.getCategoryBreakdown();

      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].category).toBe('Fixed Cost');
      expect(breakdown[0].amount).toBe(2000);
      expect(breakdown[1].category).toBe('Food');
      expect(breakdown[1].amount).toBe(1500);
    });
  });

  describe('subscription system', () => {
    it('should notify subscribers when data changes', async () => {
      mockTransactionService.getTransactions.mockResolvedValue(mockTransactions);

      const mockCallback = vi.fn();
      const unsubscribe = financialService.subscribe(mockCallback);

      await financialService.getFinancialSummary();

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          netStatus: 1500,
          totalIncome: 5000,
          totalExpenses: 3500
        })
      );

      unsubscribe();
    });

    it('should allow unsubscribing', async () => {
      mockTransactionService.getTransactions.mockResolvedValue(mockTransactions);

      const mockCallback = vi.fn();
      const unsubscribe = financialService.subscribe(mockCallback);
      unsubscribe();

      await financialService.getFinancialSummary();

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('calculateSummaryFromTransactions', () => {
    it('should calculate summary from provided transactions', () => {
      const summary = financialService.calculateSummaryFromTransactions(mockTransactions);

      expect(summary.totalIncome).toBe(5000);
      expect(summary.totalExpenses).toBe(3500);
      expect(summary.netStatus).toBe(1500);
    });
  });

  describe('getCurrentSummary', () => {
    it('should return null when no cached data', () => {
      const summary = financialService.getCurrentSummary();
      expect(summary).toBeNull();
    });

    it('should return cached data after calculation', async () => {
      mockTransactionService.getTransactions.mockResolvedValue(mockTransactions);

      await financialService.getFinancialSummary();
      const cachedSummary = financialService.getCurrentSummary();

      expect(cachedSummary).not.toBeNull();
      expect(cachedSummary?.netStatus).toBe(1500);
    });
  });
});