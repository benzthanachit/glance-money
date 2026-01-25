import { describe, it, expect } from 'vitest'
import { 
  validateTransactionData, 
  validateTransactionUpdateData,
  validateGoalData,
  validateGoalUpdateData,
  validateTransactionAllocationData,
  sanitizeTransactionData,
  sanitizeTransactionUpdateData,
  sanitizeGoalData,
  sanitizeGoalUpdateData,
  sanitizeTransactionAllocationData
} from '@/lib/utils/validation'
import { CreateTransactionData, UpdateTransactionData } from '@/lib/services/transactionService'
import { CreateGoalData, UpdateGoalData, AllocateTransactionData } from '@/lib/services/goalService'

describe('Transaction Validation', () => {
  describe('validateTransactionData', () => {
    it('should validate valid transaction data', () => {
      const validData: CreateTransactionData = {
        amount: 100.50,
        type: 'expense',
        category: 'Food',
        description: 'Lunch at restaurant',
        date: '2024-01-15',
        is_recurring: false,
      }

      const result = validateTransactionData(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject transaction with missing required fields', () => {
      const invalidData = {
        description: 'Missing required fields',
      } as CreateTransactionData

      const result = validateTransactionData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.field === 'amount')).toBe(true)
      expect(result.errors.some(e => e.field === 'type')).toBe(true)
      expect(result.errors.some(e => e.field === 'category')).toBe(true)
    })

    it('should reject transaction with invalid amount', () => {
      const invalidData: CreateTransactionData = {
        amount: -50,
        type: 'expense',
        category: 'Food',
      }

      const result = validateTransactionData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'amount')).toBe(true)
    })

    it('should reject transaction with invalid type', () => {
      const invalidData = {
        amount: 100,
        type: 'invalid_type',
        category: 'Food',
      } as CreateTransactionData

      const result = validateTransactionData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'type')).toBe(true)
    })

    it('should reject transaction with invalid date format', () => {
      const invalidData: CreateTransactionData = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        date: '2024/01/15', // Wrong format
      }

      const result = validateTransactionData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'date')).toBe(true)
    })
  })

  describe('validateTransactionUpdateData', () => {
    it('should validate valid update data', () => {
      const validUpdateData: UpdateTransactionData = {
        amount: 150.75,
        description: 'Updated description',
      }

      const result = validateTransactionUpdateData(validUpdateData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow empty update data', () => {
      const emptyUpdateData: UpdateTransactionData = {}

      const result = validateTransactionUpdateData(emptyUpdateData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('sanitizeTransactionData', () => {
    it('should sanitize transaction data correctly', () => {
      const inputData: CreateTransactionData = {
        amount: 100.5,
        type: 'expense',
        category: '  Food  ',
        description: '  Lunch  ',
        is_recurring: false,
      }

      const sanitized = sanitizeTransactionData(inputData)
      expect(sanitized.category).toBe('Food')
      expect(sanitized.description).toBe('Lunch')
      expect(sanitized.date).toBeDefined()
      expect(sanitized.is_recurring).toBe(false)
    })

    it('should set default date when not provided', () => {
      const inputData: CreateTransactionData = {
        amount: 100,
        type: 'expense',
        category: 'Food',
      }

      const sanitized = sanitizeTransactionData(inputData)
      expect(sanitized.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('sanitizeTransactionUpdateData', () => {
    it('should sanitize update data correctly', () => {
      const inputData: UpdateTransactionData = {
        category: '  Transport  ',
        description: '  Bus fare  ',
      }

      const sanitized = sanitizeTransactionUpdateData(inputData)
      expect(sanitized.category).toBe('Transport')
      expect(sanitized.description).toBe('Bus fare')
    })

    it('should handle undefined values correctly', () => {
      const inputData: UpdateTransactionData = {
        amount: 50,
        description: undefined,
      }

      const sanitized = sanitizeTransactionUpdateData(inputData)
      expect(sanitized.amount).toBe(50)
      expect(sanitized.description).toBeUndefined()
    })
  })
})

describe('Goal Validation', () => {
  describe('validateGoalData', () => {
    it('should validate valid goal data', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const futureDateString = futureDate.toISOString().split('T')[0]

      const validData: CreateGoalData = {
        name: 'Emergency Fund',
        targetAmount: 10000,
        deadline: futureDateString,
      }

      const result = validateGoalData(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject goal with missing required fields', () => {
      const invalidData = {
        deadline: '2024-12-31',
      } as CreateGoalData

      const result = validateGoalData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'name')).toBe(true)
      expect(result.errors.some(e => e.field === 'targetAmount')).toBe(true)
    })

    it('should reject goal with invalid target amount', () => {
      const invalidData: CreateGoalData = {
        name: 'Test Goal',
        targetAmount: -1000,
      }

      const result = validateGoalData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'targetAmount')).toBe(true)
    })

    it('should reject goal with past deadline', () => {
      const invalidData: CreateGoalData = {
        name: 'Test Goal',
        targetAmount: 5000,
        deadline: '2020-01-01', // Past date
      }

      const result = validateGoalData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'deadline')).toBe(true)
    })

    it('should accept goal without deadline', () => {
      const validData: CreateGoalData = {
        name: 'No Deadline Goal',
        targetAmount: 5000,
      }

      const result = validateGoalData(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateGoalUpdateData', () => {
    it('should validate valid update data', () => {
      const validUpdateData: UpdateGoalData = {
        name: 'Updated Goal Name',
        targetAmount: 15000,
      }

      const result = validateGoalUpdateData(validUpdateData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow empty update data', () => {
      const emptyUpdateData: UpdateGoalData = {}

      const result = validateGoalUpdateData(emptyUpdateData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow null deadline to remove deadline', () => {
      const updateData: UpdateGoalData = {
        deadline: null,
      }

      const result = validateGoalUpdateData(updateData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateTransactionAllocationData', () => {
    it('should validate valid allocation data', () => {
      const validData: AllocateTransactionData = {
        transactionId: 'transaction123',
        allocatedAmount: 500,
      }

      const result = validateTransactionAllocationData(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject allocation with missing fields', () => {
      const invalidData = {
        allocatedAmount: 500,
      } as AllocateTransactionData

      const result = validateTransactionAllocationData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'transactionId')).toBe(true)
    })

    it('should reject allocation with invalid amount', () => {
      const invalidData: AllocateTransactionData = {
        transactionId: 'transaction123',
        allocatedAmount: -100,
      }

      const result = validateTransactionAllocationData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'allocatedAmount')).toBe(true)
    })
  })

  describe('sanitizeGoalData', () => {
    it('should sanitize goal data correctly', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const futureDateString = futureDate.toISOString().split('T')[0]

      const inputData: CreateGoalData = {
        name: '  Emergency Fund  ',
        targetAmount: 10000,
        deadline: futureDateString,
      }

      const sanitized = sanitizeGoalData(inputData)
      expect(sanitized.name).toBe('Emergency Fund')
      expect(sanitized.targetAmount).toBe(10000)
      expect(sanitized.deadline).toBe(futureDateString)
    })

    it('should handle missing deadline', () => {
      const inputData: CreateGoalData = {
        name: 'Test Goal',
        targetAmount: 5000,
      }

      const sanitized = sanitizeGoalData(inputData)
      expect(sanitized.deadline).toBeUndefined()
    })
  })

  describe('sanitizeTransactionAllocationData', () => {
    it('should sanitize allocation data correctly', () => {
      const inputData: AllocateTransactionData = {
        transactionId: '  transaction123  ',
        allocatedAmount: 500,
      }

      const sanitized = sanitizeTransactionAllocationData(inputData)
      expect(sanitized.transactionId).toBe('transaction123')
      expect(sanitized.allocatedAmount).toBe(500)
    })
  })
})