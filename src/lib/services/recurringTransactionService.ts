import { Transaction, TransactionInsert } from '@/lib/types/database'
import { createClient as createClientSide } from '@/lib/supabase/client'
import { createClient as createServerSide } from '@/lib/supabase/server'

export interface RecurringTransactionTemplate {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  description?: string
  userId: string
  isActive: boolean
  nextDueDate: Date
  createdAt: Date
}

export interface RecurringTransactionFilters {
  isActive?: boolean
  type?: 'income' | 'expense'
  category?: string
}

class RecurringTransactionService {
  private getSupabaseClient() {
    // Use client-side supabase for browser environment
    if (typeof window !== 'undefined') {
      return createClientSide()
    }
    // This won't work on server-side, so we'll handle it differently
    throw new Error('Server-side usage requires passing supabase client')
  }

  /**
   * Get all recurring transaction templates for the authenticated user
   * For client-side usage only
   */
  async getRecurringTransactions(filters?: RecurringTransactionFilters): Promise<Transaction[]> {
    const supabase = this.getSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_recurring', true)
      .is('recurring_parent_id', null) // Only get parent transactions (templates)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    const { data: transactions, error } = await query

    if (error) {
      throw new Error(`Failed to fetch recurring transactions: ${error.message}`)
    }

    return transactions || []
  }

  /**
   * Server-side version - get recurring transactions with provided supabase client
   */
  static async getRecurringTransactionsServer(supabase: any, userId: string, filters?: RecurringTransactionFilters): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .is('recurring_parent_id', null) // Only get parent transactions (templates)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    const { data: transactions, error } = await query

    if (error) {
      throw new Error(`Failed to fetch recurring transactions: ${error.message}`)
    }

    return transactions || []
  }

  /**
   * Get all generated instances of a recurring transaction
   */
  async getRecurringTransactionInstances(parentId: string): Promise<Transaction[]> {
    const supabase = this.getSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('recurring_parent_id', parentId)
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch recurring transaction instances: ${error.message}`)
    }

    return transactions || []
  }

  /**
   * Generate monthly recurring transactions for all active templates
   * Client-side version
   */
  async generateMonthlyRecurringTransactions(): Promise<Transaction[]> {
    const supabase = this.getSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Get all recurring transaction templates
    const recurringTemplates = await this.getRecurringTransactions({ isActive: true })
    
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    // Check which templates need new instances for the current month
    const newTransactions: Transaction[] = []
    
    for (const template of recurringTemplates) {
      const shouldGenerate = await this.shouldGenerateForMonth(template.id, currentYear, currentMonth)
      
      if (shouldGenerate) {
        const newTransaction = await this.generateRecurringInstance(template, currentDate)
        newTransactions.push(newTransaction)
      }
    }

    return newTransactions
  }

  /**
   * Generate a single recurring transaction instance
   */
  async generateRecurringInstance(template: Transaction, targetDate: Date): Promise<Transaction> {
    const supabase = this.getSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Create new transaction based on template
    const transactionData: TransactionInsert = {
      user_id: user.id,
      amount: template.amount,
      type: template.type,
      category: template.category,
      description: template.description,
      date: targetDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      is_recurring: false, // Generated instances are not recurring themselves
      recurring_parent_id: template.id,
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to generate recurring transaction: ${error.message}`)
    }

    return transaction
  }

  /**
   * Check if a recurring transaction needs to be generated for a specific month
   */
  private async shouldGenerateForMonth(templateId: string, year: number, month: number): Promise<boolean> {
    const supabase = this.getSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Check if there's already a transaction for this month
    const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0]
    const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const { data: existingTransactions, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('recurring_parent_id', templateId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    if (error) {
      throw new Error(`Failed to check existing transactions: ${error.message}`)
    }

    // Generate only if no transaction exists for this month
    return !existingTransactions || existingTransactions.length === 0
  }

  /**
   * Update a recurring transaction template
   */
  async updateRecurringTransaction(id: string, updateData: Partial<Transaction>): Promise<Transaction> {
    const supabase = this.getSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Verify the transaction is a recurring template and belongs to the user
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_recurring', true)
      .is('recurring_parent_id', null)
      .single()

    if (fetchError) {
      throw new Error(`Recurring transaction not found: ${fetchError.message}`)
    }

    // Update the template
    const { data: transaction, error } = await supabase
      .from('transactions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update recurring transaction: ${error.message}`)
    }

    return transaction
  }

  /**
   * Delete a recurring transaction template and optionally its instances
   */
  async deleteRecurringTransaction(id: string, deleteInstances: boolean = false): Promise<void> {
    const supabase = this.getSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // If requested, delete all generated instances first
    if (deleteInstances) {
      const { error: instancesError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)
        .eq('recurring_parent_id', id)

      if (instancesError) {
        throw new Error(`Failed to delete recurring transaction instances: ${instancesError.message}`)
      }
    } else {
      // Just unlink instances by setting recurring_parent_id to null
      const { error: unlinkError } = await supabase
        .from('transactions')
        .update({ recurring_parent_id: null })
        .eq('user_id', user.id)
        .eq('recurring_parent_id', id)

      if (unlinkError) {
        throw new Error(`Failed to unlink recurring transaction instances: ${unlinkError.message}`)
      }
    }

    // Delete the template
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(`Failed to delete recurring transaction: ${error.message}`)
    }
  }

  /**
   * Pause/resume a recurring transaction template
   */
  async toggleRecurringTransaction(id: string): Promise<Transaction> {
    const supabase = this.getSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Get current state
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_recurring', true)
      .is('recurring_parent_id', null)
      .single()

    if (fetchError) {
      throw new Error(`Recurring transaction not found: ${fetchError.message}`)
    }

    // For now, we'll use the description field to store active/inactive state
    // In a real implementation, you might want to add an 'is_active' column
    const isCurrentlyActive = !transaction.description?.includes('[PAUSED]')
    const newDescription = isCurrentlyActive 
      ? `${transaction.description || ''} [PAUSED]`.trim()
      : (transaction.description || '').replace('[PAUSED]', '').trim()

    // Update the template
    const { data: updatedTransaction, error } = await supabase
      .from('transactions')
      .update({
        description: newDescription,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to toggle recurring transaction: ${error.message}`)
    }

    return updatedTransaction
  }

  /**
   * Check if a recurring transaction is active
   */
  isRecurringTransactionActive(transaction: Transaction): boolean {
    return !transaction.description?.includes('[PAUSED]')
  }

  /**
   * Get the next due date for a recurring transaction
   */
  getNextDueDate(transaction: Transaction): Date {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // For monthly recurring transactions, the next due date is the first of next month
    return new Date(currentYear, currentMonth + 1, 1)
  }
}

export const recurringTransactionService = new RecurringTransactionService()