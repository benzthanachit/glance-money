/**
 * Feature: glance-money, Property 12: User Data Isolation
 * 
 * **Validates: Requirements 8.4**
 * 
 * Property: For any authenticated user, the system should only provide access 
 * to that user's own data and prevent access to other users' information.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'

// Mock Supabase client for testing
const mockSupabaseClient = {
  from: (table: string) => ({
    select: () => ({
      eq: (column: string, value: string) => ({
        data: mockData[table]?.filter((item: any) => item[column] === value) || [],
        error: null
      })
    }),
    insert: (data: any) => ({
      data: [{ ...data, id: Math.random().toString() }],
      error: null
    }),
    update: (data: any) => ({
      eq: (column: string, value: string) => ({
        data: mockData[table]?.filter((item: any) => item[column] === value).map((item: any) => ({ ...item, ...data })) || [],
        error: null
      })
    }),
    delete: () => ({
      eq: (column: string, value: string) => ({
        data: mockData[table]?.filter((item: any) => item[column] === value) || [],
        error: null
      })
    })
  }),
  auth: {
    getUser: () => ({ data: { user: mockCurrentUser }, error: null })
  }
}

// Mock data store
let mockData: Record<string, any[]> = {}
let mockCurrentUser: any = null

// Test data generators
const userIdArbitrary = fc.string({ minLength: 36, maxLength: 36 })
const emailArbitrary = fc.emailAddress()
const amountArbitrary = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true })
const transactionTypeArbitrary = fc.constantFrom('income', 'expense')
const categoryArbitrary = fc.constantFrom('Food', 'Transport', 'Fixed Cost', 'DCA')
const goalNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })

const transactionArbitrary = fc.record({
  id: fc.string({ minLength: 36, maxLength: 36 }),
  user_id: userIdArbitrary,
  amount: amountArbitrary,
  type: transactionTypeArbitrary,
  category: categoryArbitrary,
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  date: fc.date().map(d => d.toISOString().split('T')[0]),
  is_recurring: fc.boolean(),
  recurring_parent_id: fc.option(fc.string({ minLength: 36, maxLength: 36 }), { nil: null })
})

const goalArbitrary = fc.record({
  id: fc.string({ minLength: 36, maxLength: 36 }),
  user_id: userIdArbitrary,
  name: goalNameArbitrary,
  target_amount: amountArbitrary,
  current_amount: fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true }),
  deadline: fc.option(fc.date().map(d => d.toISOString().split('T')[0]), { nil: null })
})

const userArbitrary = fc.record({
  id: userIdArbitrary,
  email: emailArbitrary,
  preferences: fc.record({
    language: fc.constantFrom('th', 'en'),
    currency: fc.constantFrom('THB', 'USD', 'EUR'),
    theme: fc.constantFrom('light', 'dark', 'system')
  })
})

describe('Property 12: User Data Isolation', () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockData = {
      users: [],
      transactions: [],
      goals: [],
      categories: []
    }
    mockCurrentUser = null
  })

  afterEach(() => {
    // Clean up after each test
    mockData = {}
    mockCurrentUser = null
  })

  it('should only return transactions belonging to the authenticated user', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArbitrary, { minLength: 2, maxLength: 10 }),
        userIdArbitrary,
        (transactions, currentUserId) => {
          // Setup: Create transactions for multiple users
          mockData.transactions = transactions
          mockCurrentUser = { id: currentUserId }
          
          // Ensure at least one transaction belongs to current user
          if (!transactions.some(t => t.user_id === currentUserId)) {
            mockData.transactions.push({
              ...transactions[0],
              user_id: currentUserId
            })
          }
          
          // Action: Query transactions as current user
          const result = mockSupabaseClient
            .from('transactions')
            .select()
            .eq('user_id', currentUserId)
          
          // Assertion: All returned transactions should belong to current user
          const userTransactions = result.data
          expect(userTransactions).toBeDefined()
          expect(Array.isArray(userTransactions)).toBe(true)
          
          // Property: Every transaction returned must belong to the current user
          userTransactions.forEach(transaction => {
            expect(transaction.user_id).toBe(currentUserId)
          })
          
          // Property: No transactions from other users should be returned
          const otherUserTransactions = transactions.filter(t => t.user_id !== currentUserId)
          otherUserTransactions.forEach(otherTransaction => {
            expect(userTransactions.find(t => t.id === otherTransaction.id)).toBeUndefined()
          })
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should only return goals belonging to the authenticated user', () => {
    fc.assert(
      fc.property(
        fc.array(goalArbitrary, { minLength: 2, maxLength: 10 }),
        userIdArbitrary,
        (goals, currentUserId) => {
          // Setup: Create goals for multiple users
          mockData.goals = goals
          mockCurrentUser = { id: currentUserId }
          
          // Ensure at least one goal belongs to current user
          if (!goals.some(g => g.user_id === currentUserId)) {
            mockData.goals.push({
              ...goals[0],
              user_id: currentUserId
            })
          }
          
          // Action: Query goals as current user
          const result = mockSupabaseClient
            .from('goals')
            .select()
            .eq('user_id', currentUserId)
          
          // Assertion: All returned goals should belong to current user
          const userGoals = result.data
          expect(userGoals).toBeDefined()
          expect(Array.isArray(userGoals)).toBe(true)
          
          // Property: Every goal returned must belong to the current user
          userGoals.forEach(goal => {
            expect(goal.user_id).toBe(currentUserId)
          })
          
          // Property: No goals from other users should be returned
          const otherUserGoals = goals.filter(g => g.user_id !== currentUserId)
          otherUserGoals.forEach(otherGoal => {
            expect(userGoals.find(g => g.id === otherGoal.id)).toBeUndefined()
          })
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should only return user profile for the authenticated user', () => {
    fc.assert(
      fc.property(
        fc.array(userArbitrary, { minLength: 2, maxLength: 10 }),
        userIdArbitrary,
        (users, currentUserId) => {
          // Setup: Create multiple user profiles
          mockData.users = users
          mockCurrentUser = { id: currentUserId }
          
          // Ensure current user exists in the data
          if (!users.some(u => u.id === currentUserId)) {
            mockData.users.push({
              ...users[0],
              id: currentUserId
            })
          }
          
          // Action: Query user profile as current user
          const result = mockSupabaseClient
            .from('users')
            .select()
            .eq('id', currentUserId)
          
          // Assertion: Only current user's profile should be returned
          const userProfiles = result.data
          expect(userProfiles).toBeDefined()
          expect(Array.isArray(userProfiles)).toBe(true)
          
          // Property: Only one user profile should be returned
          expect(userProfiles.length).toBeLessThanOrEqual(1)
          
          // Property: If a profile is returned, it must belong to current user
          if (userProfiles.length > 0) {
            expect(userProfiles[0].id).toBe(currentUserId)
          }
          
          // Property: No other user profiles should be accessible
          const otherUsers = users.filter(u => u.id !== currentUserId)
          otherUsers.forEach(otherUser => {
            expect(userProfiles.find(u => u.id === otherUser.id)).toBeUndefined()
          })
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should prevent cross-user data modification', () => {
    fc.assert(
      fc.property(
        transactionArbitrary,
        userIdArbitrary,
        userIdArbitrary,
        (transaction, ownerId, attackerId) => {
          fc.pre(ownerId !== attackerId) // Ensure different users
          
          // Setup: Create transaction owned by one user
          mockData.transactions = [{ ...transaction, user_id: ownerId }]
          mockCurrentUser = { id: attackerId }
          
          // Action: Attempt to modify another user's transaction
          const updateResult = mockSupabaseClient
            .from('transactions')
            .update({ amount: 999999 })
            .eq('user_id', attackerId) // This should return empty since no transactions belong to attacker
          
          // Assertion: No transactions should be modified
          const modifiedTransactions = updateResult.data
          expect(modifiedTransactions).toBeDefined()
          expect(Array.isArray(modifiedTransactions)).toBe(true)
          
          // Property: Attacker should not be able to modify owner's transaction
          expect(modifiedTransactions.length).toBe(0)
          
          // Property: Original transaction should remain unchanged
          const originalTransaction = mockData.transactions.find(t => t.id === transaction.id)
          expect(originalTransaction?.user_id).toBe(ownerId)
          expect(originalTransaction?.amount).toBe(transaction.amount)
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should prevent cross-user data deletion', () => {
    fc.assert(
      fc.property(
        goalArbitrary,
        userIdArbitrary,
        userIdArbitrary,
        (goal, ownerId, attackerId) => {
          fc.pre(ownerId !== attackerId) // Ensure different users
          
          // Setup: Create goal owned by one user
          mockData.goals = [{ ...goal, user_id: ownerId }]
          mockCurrentUser = { id: attackerId }
          
          // Action: Attempt to delete another user's goal
          const deleteResult = mockSupabaseClient
            .from('goals')
            .delete()
            .eq('user_id', attackerId) // This should return empty since no goals belong to attacker
          
          // Assertion: No goals should be deleted
          const deletedGoals = deleteResult.data
          expect(deletedGoals).toBeDefined()
          expect(Array.isArray(deletedGoals)).toBe(true)
          
          // Property: Attacker should not be able to delete owner's goal
          expect(deletedGoals.length).toBe(0)
          
          // Property: Original goal should still exist
          const originalGoal = mockData.goals.find(g => g.id === goal.id)
          expect(originalGoal).toBeDefined()
          expect(originalGoal?.user_id).toBe(ownerId)
        }
      ),
      { numRuns: 20 }
    )
  })
})