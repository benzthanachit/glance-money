import { describe, it, expect, vi, beforeEach } from 'vitest'
import { goalService } from '@/lib/services/goalService'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('GoalService', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('getGoals', () => {
    it('should fetch goals successfully', async () => {
      const mockGoals = [
        {
          id: '1',
          userId: 'user1',
          name: 'Emergency Fund',
          targetAmount: 10000,
          currentAmount: 5000,
          progressPercentage: 50,
          remainingAmount: 5000,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ goals: mockGoals }),
      })

      const result = await goalService.getGoals()
      
      expect(mockFetch).toHaveBeenCalledWith('/api/goals', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockGoals)
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'API Error' }),
      })

      await expect(goalService.getGoals()).rejects.toThrow('API Error')
    })
  })

  describe('createGoal', () => {
    it('should create a goal successfully', async () => {
      const goalData = {
        name: 'Vacation Fund',
        targetAmount: 5000,
        deadline: '2024-12-31',
      }

      const mockGoal = {
        id: '1',
        user_id: 'user1',
        name: 'Vacation Fund',
        target_amount: 5000,
        current_amount: 0,
        deadline: '2024-12-31',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ goal: mockGoal }),
      })

      const result = await goalService.createGoal(goalData)
      
      expect(mockFetch).toHaveBeenCalledWith('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      })
      expect(result).toEqual(mockGoal)
    })
  })

  describe('allocateTransactionToGoal', () => {
    it('should allocate transaction to goal successfully', async () => {
      const goalId = 'goal1'
      const allocationData = {
        transactionId: 'transaction1',
        allocatedAmount: 1000,
      }

      const mockAllocation = {
        id: 'allocation1',
        goal_id: goalId,
        transaction_id: 'transaction1',
        allocated_amount: 1000,
        created_at: new Date().toISOString(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ allocation: mockAllocation }),
      })

      const result = await goalService.allocateTransactionToGoal(goalId, allocationData)
      
      expect(mockFetch).toHaveBeenCalledWith(`/api/goals/${goalId}/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(allocationData),
      })
      expect(result).toEqual(mockAllocation)
    })
  })

  describe('getGoalSummary', () => {
    it('should fetch goal summary successfully', async () => {
      const mockSummary = {
        totalGoals: 3,
        totalTargetAmount: 25000,
        totalCurrentAmount: 12000,
        averageProgress: 48,
        goalsCompleted: 1,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ summary: mockSummary }),
      })

      const result = await goalService.getGoalSummary()
      
      expect(mockFetch).toHaveBeenCalledWith('/api/goals/summary', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockSummary)
    })
  })
})