import { createClient } from '@/lib/supabase/client'
import { Transaction, TransactionInsert } from '@/lib/types/database'

/**
 * Utility class for scheduling and generating recurring transactions
 */
export class RecurringScheduler {
  private supabase = createClient()

  /**
   * Generate recurring transactions for all users for the current month
   * This would typically be called by a cron job or scheduled task
   */
  async generateAllRecurringTransactions(): Promise<{
    totalGenerated: number
    userCount: number
    errors: string[]
  }> {
    const errors: string[] = []
    let totalGenerated = 0
    let userCount = 0

    try {
      // Get all users with recurring transactions
      const { data: users, error: usersError } = await this.supabase
        .from('transactions')
        .select('user_id')
        .eq('is_recurring', true)
        .is('recurring_parent_id', null)

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`)
      }

      // Get unique user IDs
      const uniqueUserIds = [...new Set(users?.map(u => u.user_id) || [])]
      userCount = uniqueUserIds.length

      // Generate recurring transactions for each user
      for (const userId of uniqueUserIds) {
        try {
          const generated = await this.generateRecurringTransactionsForUser(userId)
          totalGenerated += generated
        } catch (error) {
          const errorMessage = `Failed to generate for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMessage)
          console.error(errorMessage)
        }
      }

      return {
        totalGenerated,
        userCount,
        errors
      }
    } catch (error) {
      const errorMessage = `Failed to generate recurring transactions: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMessage)
      return {
        totalGenerated: 0,
        userCount: 0,
        errors
      }
    }
  }

  /**
   * Generate recurring transactions for a specific user for the current month
   */
  async generateRecurringTransactionsForUser(userId: string): Promise<number> {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    // Get all active recurring transaction templates for the user
    const { data: templates, error: templatesError } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .is('recurring_parent_id', null)

    if (templatesError) {
      throw new Error(`Failed to fetch templates: ${templatesError.message}`)
    }

    if (!templates || templates.length === 0) {
      return 0
    }

    let generatedCount = 0

    for (const template of templates) {
      // Check if template is active (not paused)
      const isActive = !template.description?.includes('[PAUSED]')
      if (!isActive) {
        continue
      }

      // Check if we already generated a transaction for this month
      const shouldGenerate = await this.shouldGenerateForMonth(template.id, userId, currentYear, currentMonth)

      if (shouldGenerate) {
        try {
          // Calculate the target date based on template's day of month
          const templateDate = new Date(template.date)
          const dayOfMonth = templateDate.getDate()
          const targetDate = this.getDateForMonth(currentYear, currentMonth, dayOfMonth)

          await this.generateRecurringInstance(template, targetDate)
          generatedCount++
        } catch (error) {
          console.error(`Failed to generate instance for template ${template.id}:`, error)
          // Continue with other templates even if one fails
        }
      }
    }

    return generatedCount
  }

  /**
   * Helper to get a valid date for a specific month/year given a day preference
   */
  private getDateForMonth(year: number, month: number, day: number): Date {
    // Get the last day of the target month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    const validDay = Math.min(day, lastDayOfMonth)
    return new Date(year, month, validDay)
  }

  /**
   * Check if a recurring transaction needs to be generated for a specific month
   */
  private async shouldGenerateForMonth(
    templateId: string,
    userId: string,
    year: number,
    month: number
  ): Promise<boolean> {
    // Check if there's already a transaction for this month
    const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0]
    const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const { data: existingTransactions, error } = await this.supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
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
   * Generate a single recurring transaction instance
   */
  private async generateRecurringInstance(template: Transaction, targetDate: Date): Promise<Transaction> {
    // Create new transaction based on template
    const transactionData: TransactionInsert = {
      user_id: template.user_id,
      amount: template.amount,
      type: template.type,
      category: template.category,
      description: template.description?.replace('[PAUSED]', '').trim() || null,
      date: targetDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      is_recurring: false, // Generated instances are not recurring themselves
      recurring_parent_id: template.id,
    }

    const { data: transaction, error } = await this.supabase
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
   * Get statistics about recurring transactions
   */
  async getRecurringTransactionStats(): Promise<{
    totalTemplates: number
    activeTemplates: number
    pausedTemplates: number
    totalInstancesThisMonth: number
    totalInstancesAllTime: number
  }> {
    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0]

    // Get template counts
    const { data: templates, error: templatesError } = await this.supabase
      .from('transactions')
      .select('description')
      .eq('is_recurring', true)
      .is('recurring_parent_id', null)

    if (templatesError) {
      throw new Error(`Failed to fetch template stats: ${templatesError.message}`)
    }

    const totalTemplates = templates?.length || 0
    const pausedTemplates = templates?.filter(t => t.description?.includes('[PAUSED]')).length || 0
    const activeTemplates = totalTemplates - pausedTemplates

    // Get instance counts
    const { count: instancesThisMonth, error: thisMonthError } = await this.supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .not('recurring_parent_id', 'is', null)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    if (thisMonthError) {
      throw new Error(`Failed to fetch this month stats: ${thisMonthError.message}`)
    }

    const { count: instancesAllTime, error: allTimeError } = await this.supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .not('recurring_parent_id', 'is', null)

    if (allTimeError) {
      throw new Error(`Failed to fetch all time stats: ${allTimeError.message}`)
    }

    return {
      totalTemplates,
      activeTemplates,
      pausedTemplates,
      totalInstancesThisMonth: instancesThisMonth || 0,
      totalInstancesAllTime: instancesAllTime || 0
    }
  }

  /**
   * Clean up old recurring transaction instances (optional maintenance)
   * Removes instances older than specified months
   */
  async cleanupOldInstances(monthsToKeep: number = 12): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep)
    const cutoffDateString = cutoffDate.toISOString().split('T')[0]

    const { data: deletedTransactions, error } = await this.supabase
      .from('transactions')
      .delete()
      .not('recurring_parent_id', 'is', null)
      .lt('date', cutoffDateString)
      .select('id')

    if (error) {
      throw new Error(`Failed to cleanup old instances: ${error.message}`)
    }

    return deletedTransactions?.length || 0
  }
}

// Export singleton instance
export const recurringScheduler = new RecurringScheduler()