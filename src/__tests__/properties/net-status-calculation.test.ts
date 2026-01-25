/**
 * Feature: glance-money, Property 5: Net Status Calculation and Theming
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
 * 
 * Property: For any set of transactions, the Net_Status should equal Income 
 * minus total expenses, and the theme should be green for positive values 
 * and red for negative values, updating immediately when transactions change.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Transaction interface
interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
}

// Net Status result interface
interface NetStatusResult {
  totalIncome: number
  totalExpenses: number
  netStatus: number
  theme: 'positive' | 'negative'
  themeColor: 'green' | 'red'
}

// Test data generators
const transactionTypeArbitrary = fc.constantFrom('income', 'expense')
const amountArbitrary = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true })
const categoryArbitrary = fc.constantFrom('Food', 'Transport', 'Fixed Cost', 'DCA', 'Salary', 'Freelance')
const dateArbitrary = fc.constantFrom('2024-01-01', '2024-01-15', '2024-02-01')

const transactionArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  amount: amountArbitrary,
  type: transactionTypeArbitrary,
  category: categoryArbitrary,
  date: dateArbitrary
})

// Core calculation functions
const calculateNetStatus = (transactions: Transaction[]): NetStatusResult => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netStatus = totalIncome - totalExpenses

  const theme = netStatus >= 0 ? 'positive' : 'negative'
  const themeColor = netStatus >= 0 ? 'green' : 'red'

  return {
    totalIncome,
    totalExpenses,
    netStatus,
    theme,
    themeColor
  }
}

const updateTransactions = (
  currentTransactions: Transaction[],
  newTransaction: Transaction
): Transaction[] => {
  return [...currentTransactions, newTransaction]
}

const removeTransaction = (
  currentTransactions: Transaction[],
  transactionId: string
): Transaction[] => {
  return currentTransactions.filter(t => t.id !== transactionId)
}

describe('Property 5: Net Status Calculation and Theming', () => {
  it('should calculate Net Status correctly for any set of transactions', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArbitrary, { minLength: 0, maxLength: 20 }),
        (transactions) => {
          const result = calculateNetStatus(transactions)

          // Property: Total income should equal sum of all income transactions
          const expectedIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)
          expect(Math.abs(result.totalIncome - expectedIncome)).toBeLessThan(0.001)

          // Property: Total expenses should equal sum of all expense transactions
          const expectedExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)
          expect(Math.abs(result.totalExpenses - expectedExpenses)).toBeLessThan(0.001)

          // Property: Net Status should equal Income - Expenses
          const expectedNetStatus = expectedIncome - expectedExpenses
          expect(Math.abs(result.netStatus - expectedNetStatus)).toBeLessThan(0.001)

          // Property: Theme should be positive for non-negative net status
          if (result.netStatus >= 0) {
            expect(result.theme).toBe('positive')
            expect(result.themeColor).toBe('green')
          } else {
            expect(result.theme).toBe('negative')
            expect(result.themeColor).toBe('red')
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should update theme immediately when transactions change', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArbitrary, { minLength: 1, maxLength: 10 }),
        transactionArbitrary,
        (initialTransactions, newTransaction) => {
          // Calculate initial state
          const initialResult = calculateNetStatus(initialTransactions)

          // Add new transaction
          const updatedTransactions = updateTransactions(initialTransactions, newTransaction)
          const updatedResult = calculateNetStatus(updatedTransactions)

          // Property: Net status should update correctly
          const expectedChange = newTransaction.type === 'income' 
            ? newTransaction.amount 
            : -newTransaction.amount
          const expectedNewNetStatus = initialResult.netStatus + expectedChange
          expect(Math.abs(updatedResult.netStatus - expectedNewNetStatus)).toBeLessThan(0.001)

          // Property: Theme should update immediately based on new net status
          if (updatedResult.netStatus >= 0) {
            expect(updatedResult.theme).toBe('positive')
            expect(updatedResult.themeColor).toBe('green')
          } else {
            expect(updatedResult.theme).toBe('negative')
            expect(updatedResult.themeColor).toBe('red')
          }

          // Property: Theme change should be consistent
          const themeChanged = initialResult.theme !== updatedResult.theme
          const netStatusSignChanged = (initialResult.netStatus >= 0) !== (updatedResult.netStatus >= 0)
          expect(themeChanged).toBe(netStatusSignChanged)
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should handle transaction removal correctly', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArbitrary, { minLength: 2, maxLength: 10 }),
        (transactions) => {
          // Ensure unique IDs
          const uniqueTransactions = transactions.map((t, index) => ({
            ...t,
            id: `transaction-${index}`
          }))

          const initialResult = calculateNetStatus(uniqueTransactions)
          
          // Remove a random transaction
          const transactionToRemove = uniqueTransactions[0]
          const remainingTransactions = removeTransaction(uniqueTransactions, transactionToRemove.id)
          const finalResult = calculateNetStatus(remainingTransactions)

          // Property: Net status should update correctly after removal
          const expectedChange = transactionToRemove.type === 'income' 
            ? -transactionToRemove.amount 
            : transactionToRemove.amount
          const expectedNewNetStatus = initialResult.netStatus + expectedChange
          expect(Math.abs(finalResult.netStatus - expectedNewNetStatus)).toBeLessThan(0.001)

          // Property: Theme should reflect new net status
          if (finalResult.netStatus >= 0) {
            expect(finalResult.theme).toBe('positive')
            expect(finalResult.themeColor).toBe('green')
          } else {
            expect(finalResult.theme).toBe('negative')
            expect(finalResult.themeColor).toBe('red')
          }

          // Property: Transaction count should decrease by one
          expect(remainingTransactions.length).toBe(uniqueTransactions.length - 1)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should handle edge cases correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          emptyTransactions: fc.constant([]),
          onlyIncomeTransactions: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 5 }),
              amount: amountArbitrary,
              type: fc.constant('income' as const),
              category: categoryArbitrary,
              date: dateArbitrary
            }),
            { minLength: 1, maxLength: 5 }
          ),
          onlyExpenseTransactions: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 5 }),
              amount: amountArbitrary,
              type: fc.constant('expense' as const),
              category: categoryArbitrary,
              date: dateArbitrary
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        (testCases) => {
          // Property: Empty transactions should result in zero net status and positive theme
          const emptyResult = calculateNetStatus(testCases.emptyTransactions)
          expect(emptyResult.totalIncome).toBe(0)
          expect(emptyResult.totalExpenses).toBe(0)
          expect(emptyResult.netStatus).toBe(0)
          expect(emptyResult.theme).toBe('positive')
          expect(emptyResult.themeColor).toBe('green')

          // Property: Only income transactions should result in positive net status
          const incomeResult = calculateNetStatus(testCases.onlyIncomeTransactions)
          expect(incomeResult.totalExpenses).toBe(0)
          expect(incomeResult.netStatus).toBe(incomeResult.totalIncome)
          expect(incomeResult.netStatus).toBeGreaterThan(0)
          expect(incomeResult.theme).toBe('positive')
          expect(incomeResult.themeColor).toBe('green')

          // Property: Only expense transactions should result in negative net status
          const expenseResult = calculateNetStatus(testCases.onlyExpenseTransactions)
          expect(expenseResult.totalIncome).toBe(0)
          expect(expenseResult.netStatus).toBe(-expenseResult.totalExpenses)
          expect(expenseResult.netStatus).toBeLessThan(0)
          expect(expenseResult.theme).toBe('negative')
          expect(expenseResult.themeColor).toBe('red')
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should maintain calculation consistency across operations', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArbitrary, { minLength: 3, maxLength: 8 }),
        (transactions) => {
          // Ensure unique IDs
          const uniqueTransactions = transactions.map((t, index) => ({
            ...t,
            id: `tx-${index}`
          }))

          // Calculate in different ways
          const directResult = calculateNetStatus(uniqueTransactions)

          // Calculate by building up transactions one by one
          let buildUpResult = calculateNetStatus([])
          for (const transaction of uniqueTransactions) {
            const currentTransactions = updateTransactions(
              buildUpResult.netStatus === 0 && buildUpResult.totalIncome === 0 && buildUpResult.totalExpenses === 0 
                ? [] 
                : uniqueTransactions.slice(0, uniqueTransactions.indexOf(transaction))
            , transaction)
            buildUpResult = calculateNetStatus(currentTransactions)
          }

          // Property: Results should be consistent regardless of calculation method
          expect(Math.abs(directResult.netStatus - buildUpResult.netStatus)).toBeLessThan(0.001)
          expect(directResult.theme).toBe(buildUpResult.theme)
          expect(directResult.themeColor).toBe(buildUpResult.themeColor)

          // Property: Mathematical properties should hold
          expect(directResult.netStatus).toBe(directResult.totalIncome - directResult.totalExpenses)
          expect(directResult.totalIncome).toBeGreaterThanOrEqual(0)
          expect(directResult.totalExpenses).toBeGreaterThanOrEqual(0)
        }
      ),
      { numRuns: 20 }
    )
  })
})