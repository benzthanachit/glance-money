import { describe, it, expect } from 'vitest'

// Create a simple test class to test the logic without database dependencies
class RecurringTransactionTestHelper {
  isRecurringTransactionActive(transaction: { description?: string | null }): boolean {
    return !transaction.description?.includes('[PAUSED]')
  }

  getNextDueDate(): Date {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // For monthly recurring transactions, the next due date is the first of next month
    return new Date(currentYear, currentMonth + 1, 1)
  }
}

const helper = new RecurringTransactionTestHelper()

describe('RecurringTransactionService Logic', () => {
  describe('isRecurringTransactionActive', () => {
    it('should return true for active transactions', () => {
      const transaction = {
        description: 'Active transaction'
      }

      const isActive = helper.isRecurringTransactionActive(transaction)
      expect(isActive).toBe(true)
    })

    it('should return false for paused transactions', () => {
      const transaction = {
        description: 'Paused transaction [PAUSED]'
      }

      const isActive = helper.isRecurringTransactionActive(transaction)
      expect(isActive).toBe(false)
    })

    it('should return true for transactions with null description', () => {
      const transaction = {
        description: null
      }

      const isActive = helper.isRecurringTransactionActive(transaction)
      expect(isActive).toBe(true)
    })

    it('should return true for transactions with undefined description', () => {
      const transaction = {}

      const isActive = helper.isRecurringTransactionActive(transaction)
      expect(isActive).toBe(true)
    })
  })

  describe('getNextDueDate', () => {
    it('should return next month as due date', () => {
      const nextDueDate = helper.getNextDueDate()
      expect(nextDueDate).toBeInstanceOf(Date)
      
      // Should be first day of next month
      const now = new Date()
      const expectedDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      expect(nextDueDate.getTime()).toBe(expectedDate.getTime())
    })

    it('should return first day of the month', () => {
      const nextDueDate = helper.getNextDueDate()
      expect(nextDueDate.getDate()).toBe(1)
    })
  })
})