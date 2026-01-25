import { describe, it, expect, vi, beforeEach } from 'vitest'
import { transactionService } from '@/lib/services/transactionService'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('TransactionService', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('getTransactions', () => {
    it('should fetch transactions without filters', async () => {
      const mockTransactions = [
        {
          id: '1',
          user_id: 'user1',
          amount: 100,
          type: 'expense',
          category: 'Food',
          date: '2024-01-15',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transactions: mockTransactions }),
      })

      const result = await transactionService.getTransactions()

      expect(mockFetch).toHaveBeenCalledWith('/api/transactions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockTransactions)
    })

    it('should fetch transactions with filters', async () => {
      const mockTransactions = []
      const filters = {
        category: 'Food',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 10,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transactions: mockTransactions }),
      })

      await transactionService.getTransactions(filters)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/transactions?category=Food&startDate=2024-01-01&endDate=2024-01-31&limit=10',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    })

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      })

      await expect(transactionService.getTransactions()).rejects.toThrow('Unauthorized')
    })
  })

  describe('createTransaction', () => {
    it('should create a transaction', async () => {
      const transactionData = {
        amount: 100,
        type: 'expense' as const,
        category: 'Food',
        description: 'Lunch',
      }

      const mockTransaction = {
        id: '1',
        user_id: 'user1',
        ...transactionData,
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transaction: mockTransaction }),
      })

      const result = await transactionService.createTransaction(transactionData)

      expect(mockFetch).toHaveBeenCalledWith('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      })
      expect(result).toEqual(mockTransaction)
    })
  })

  describe('updateTransaction', () => {
    it('should update a transaction', async () => {
      const updateData = {
        amount: 150,
        description: 'Updated lunch',
      }

      const mockTransaction = {
        id: '1',
        user_id: 'user1',
        amount: 150,
        type: 'expense',
        category: 'Food',
        description: 'Updated lunch',
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T11:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transaction: mockTransaction }),
      })

      const result = await transactionService.updateTransaction('1', updateData)

      expect(mockFetch).toHaveBeenCalledWith('/api/transactions/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      expect(result).toEqual(mockTransaction)
    })
  })

  describe('deleteTransaction', () => {
    it('should delete a transaction', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Transaction deleted successfully' }),
      })

      await transactionService.deleteTransaction('1')

      expect(mockFetch).toHaveBeenCalledWith('/api/transactions/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })
  })
})