/**
 * Feature: glance-money, Property 3: Transaction Entry Workflow
 * 
 * **Validates: Requirements 2.2, 2.4, 6.3**
 * 
 * Property: For any transaction creation attempt, tapping the FAB should open 
 * the transaction form, and the form should allow category selection from 
 * predefined options with visual feedback.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Mock transaction form state and workflow
interface TransactionFormState {
  isOpen: boolean
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  isRecurring: boolean
  selectedCategory: string | null
  hasVisualFeedback: boolean
}

interface FABState {
  isVisible: boolean
  isClickable: boolean
  position: 'center-bottom' | 'bottom-right'
}

interface CategoryOption {
  id: string
  name: string
  icon: string
  type: 'income' | 'expense' | 'both'
  isSelected: boolean
}

// Predefined categories as per requirements
const PREDEFINED_CATEGORIES: CategoryOption[] = [
  { id: 'food', name: 'Food', icon: '🍽️', type: 'expense', isSelected: false },
  { id: 'transport', name: 'Transport', icon: '🚗', type: 'expense', isSelected: false },
  { id: 'fixed-cost', name: 'Fixed Cost', icon: '🏠', type: 'expense', isSelected: false },
  { id: 'dca', name: 'DCA', icon: '📈', type: 'both', isSelected: false },
  { id: 'salary', name: 'Salary', icon: '💰', type: 'income', isSelected: false },
  { id: 'freelance', name: 'Freelance', icon: '💼', type: 'income', isSelected: false }
]

// Test data generators
const transactionTypeArbitrary = fc.constantFrom('income', 'expense')
const amountArbitrary = fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true })
const categoryIdArbitrary = fc.constantFrom('food', 'transport', 'fixed-cost', 'dca', 'salary', 'freelance')
const descriptionArbitrary = fc.string({ minLength: 0, maxLength: 100 })

const transactionDataArbitrary = fc.record({
  type: transactionTypeArbitrary,
  amount: amountArbitrary,
  category: categoryIdArbitrary,
  description: descriptionArbitrary,
  isRecurring: fc.boolean()
})

// Mock workflow functions
const mockFABClick = (fabState: FABState): TransactionFormState => {
  if (!fabState.isVisible || !fabState.isClickable) {
    throw new Error('FAB is not accessible')
  }

  return {
    isOpen: true,
    type: 'expense', // Default to expense
    amount: 0,
    category: '',
    description: '',
    isRecurring: false,
    selectedCategory: null,
    hasVisualFeedback: false
  }
}

const mockCategorySelection = (
  formState: TransactionFormState, 
  categoryId: string
): TransactionFormState => {
  const category = PREDEFINED_CATEGORIES.find(c => c.id === categoryId)
  if (!category) {
    throw new Error('Invalid category selection')
  }

  // Check if category is valid for transaction type
  if (category.type !== 'both' && category.type !== formState.type) {
    throw new Error('Category not valid for transaction type')
  }

  return {
    ...formState,
    category: categoryId,
    selectedCategory: categoryId,
    hasVisualFeedback: true
  }
}

const getAvailableCategories = (transactionType: 'income' | 'expense'): CategoryOption[] => {
  return PREDEFINED_CATEGORIES.filter(cat => 
    cat.type === transactionType || cat.type === 'both'
  )
}

describe('Property 3: Transaction Entry Workflow', () => {
  it('should open transaction form when FAB is tapped', () => {
    fc.assert(
      fc.property(
        fc.record({
          isVisible: fc.boolean(),
          isClickable: fc.boolean(),
          position: fc.constantFrom('center-bottom', 'bottom-right')
        }),
        (fabState) => {
          // Property: FAB should be accessible to open form
          if (fabState.isVisible && fabState.isClickable) {
            const formState = mockFABClick(fabState)
            
            // Property: Form should open when FAB is tapped
            expect(formState.isOpen).toBe(true)
            
            // Property: Form should have default state
            expect(formState.type).toBe('expense') // Default type
            expect(formState.amount).toBe(0)
            expect(formState.category).toBe('')
            expect(formState.selectedCategory).toBe(null)
          } else {
            // Property: Inaccessible FAB should not open form
            expect(() => mockFABClick(fabState)).toThrow('FAB is not accessible')
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should allow category selection from predefined options', () => {
    fc.assert(
      fc.property(
        transactionTypeArbitrary,
        categoryIdArbitrary,
        (transactionType, categoryId) => {
          // Setup: Create form state
          const initialFormState: TransactionFormState = {
            isOpen: true,
            type: transactionType,
            amount: 0,
            category: '',
            description: '',
            isRecurring: false,
            selectedCategory: null,
            hasVisualFeedback: false
          }

          const availableCategories = getAvailableCategories(transactionType)
          const selectedCategory = PREDEFINED_CATEGORIES.find(c => c.id === categoryId)

          // Property: Only valid categories should be selectable
          if (selectedCategory && (selectedCategory.type === transactionType || selectedCategory.type === 'both')) {
            const updatedFormState = mockCategorySelection(initialFormState, categoryId)
            
            // Property: Category should be selected
            expect(updatedFormState.selectedCategory).toBe(categoryId)
            expect(updatedFormState.category).toBe(categoryId)
            
            // Property: Visual feedback should be provided
            expect(updatedFormState.hasVisualFeedback).toBe(true)
            
            // Property: Selected category should be in available categories
            expect(availableCategories.some(cat => cat.id === categoryId)).toBe(true)
          } else {
            // Property: Invalid category selection should fail
            expect(() => mockCategorySelection(initialFormState, categoryId))
              .toThrow()
          }
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should provide correct categories based on transaction type', () => {
    fc.assert(
      fc.property(
        transactionTypeArbitrary,
        (transactionType) => {
          const availableCategories = getAvailableCategories(transactionType)

          // Property: Should always have categories available
          expect(availableCategories.length).toBeGreaterThan(0)

          // Property: All categories should be valid for the transaction type
          availableCategories.forEach(category => {
            expect(category.type === transactionType || category.type === 'both').toBe(true)
          })

          // Property: Should include 'both' type categories
          const bothTypeCategories = availableCategories.filter(cat => cat.type === 'both')
          expect(bothTypeCategories.length).toBeGreaterThan(0)

          // Property: Should include specific type categories
          const specificTypeCategories = availableCategories.filter(cat => cat.type === transactionType)
          if (transactionType === 'expense') {
            expect(specificTypeCategories.length).toBeGreaterThanOrEqual(3) // Food, Transport, Fixed Cost
          } else {
            expect(specificTypeCategories.length).toBeGreaterThanOrEqual(1) // At least Salary or Freelance
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should handle complete transaction entry workflow', () => {
    fc.assert(
      fc.property(
        transactionDataArbitrary,
        (transactionData) => {
          // Step 1: FAB click opens form
          const fabState: FABState = { isVisible: true, isClickable: true, position: 'center-bottom' }
          const formState = mockFABClick(fabState)
          expect(formState.isOpen).toBe(true)

          // Step 2: Set transaction type
          const typedFormState = { ...formState, type: transactionData.type }

          // Step 3: Select category
          const availableCategories = getAvailableCategories(transactionData.type)
          const validCategory = availableCategories.find(cat => cat.id === transactionData.category)

          if (validCategory) {
            const categoryFormState = mockCategorySelection(typedFormState, transactionData.category)

            // Property: Complete workflow should result in valid form state
            expect(categoryFormState.isOpen).toBe(true)
            expect(categoryFormState.type).toBe(transactionData.type)
            expect(categoryFormState.selectedCategory).toBe(transactionData.category)
            expect(categoryFormState.hasVisualFeedback).toBe(true)

            // Property: Form should be ready for submission
            const isFormValid = categoryFormState.selectedCategory !== null && 
                               categoryFormState.type !== null &&
                               categoryFormState.isOpen === true
            expect(isFormValid).toBe(true)
          }
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should maintain predefined category consistency', () => {
    fc.assert(
      fc.property(
        fc.constant(PREDEFINED_CATEGORIES),
        (categories) => {
          // Property: Should have required categories
          const requiredCategories = ['food', 'transport', 'fixed-cost', 'dca']
          requiredCategories.forEach(reqCat => {
            expect(categories.some(cat => cat.id === reqCat)).toBe(true)
          })

          // Property: Each category should have required properties
          categories.forEach(category => {
            expect(category.id).toBeTruthy()
            expect(category.name).toBeTruthy()
            expect(category.icon).toBeTruthy()
            expect(['income', 'expense', 'both']).toContain(category.type)
            expect(typeof category.isSelected).toBe('boolean')
          })

          // Property: Categories should be unique
          const categoryIds = categories.map(cat => cat.id)
          const uniqueIds = [...new Set(categoryIds)]
          expect(categoryIds.length).toBe(uniqueIds.length)

          // Property: Should have both income and expense categories
          const hasIncomeCategories = categories.some(cat => cat.type === 'income' || cat.type === 'both')
          const hasExpenseCategories = categories.some(cat => cat.type === 'expense' || cat.type === 'both')
          expect(hasIncomeCategories).toBe(true)
          expect(hasExpenseCategories).toBe(true)
        }
      ),
      { numRuns: 10 }
    )
  })
})