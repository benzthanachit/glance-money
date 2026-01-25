import { describe, it, expect } from 'vitest'
import { 
  validateTransactionData, 
  validateTransactionUpdateData,
  sanitizeTransactionData,
  sanitizeTransactionUpdateData
} from '@/lib/utils/validation'
import { CreateTransactionData, UpdateTransactionData } from '@/lib/services/transactionService'

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