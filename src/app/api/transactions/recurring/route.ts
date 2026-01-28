import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/transactions/recurring - Get all recurring transaction templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'income' | 'expense' | null
    const category = searchParams.get('category')

    // Build query for recurring transactions
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_recurring', true)
      .is('recurring_parent_id', null) // Only get parent transactions (templates)
      .order('created_at', { ascending: false })

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data: recurringTransactions, error } = await query

    if (error) {
      console.error('Error fetching recurring transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch recurring transactions' }, { status: 500 })
    }

    // Add status information to each recurring transaction
    const enrichedTransactions = (recurringTransactions || []).map(transaction => ({
      ...transaction,
      isActive: !transaction.description?.includes('[PAUSED]'),
      nextDueDate: getNextDueDate(transaction).toISOString(), // Convert to string to avoid hydration issues
    }))

    return NextResponse.json({ recurringTransactions: enrichedTransactions })
  } catch (error) {
    console.error('Error fetching recurring transactions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recurring transactions' },
      { status: 500 }
    )
  }
}

// POST /api/transactions/recurring/generate - Generate monthly recurring transactions
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all recurring transaction templates
    const { data: recurringTemplates, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_recurring', true)
      .is('recurring_parent_id', null)
      .not('description', 'like', '%[PAUSED]%') // Only active templates

    if (fetchError) {
      console.error('Error fetching recurring templates:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch recurring templates' }, { status: 500 })
    }

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    // Check which templates need new instances for the current month
    const newTransactions = []

    for (const template of recurringTemplates || []) {
      const shouldGenerate = await shouldGenerateForMonth(supabase, template.id, user.id, currentYear, currentMonth)

      if (shouldGenerate) {
        // Calculate the target date based on template's day of month
        const templateDate = new Date(template.date)
        const dayOfMonth = templateDate.getDate()

        // Handle month end days (e.g. 31st in Feb)
        const targetDate = getDateForMonth(currentYear, currentMonth, dayOfMonth)

        const newTransaction = await generateRecurringInstance(supabase, template, user.id, targetDate)
        if (newTransaction) {
          newTransactions.push(newTransaction)
        }
      }
    }

    return NextResponse.json({
      message: `Generated ${newTransactions.length} recurring transactions`,
      transactions: newTransactions
    })
  } catch (error) {
    console.error('Error generating recurring transactions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recurring transactions' },
      { status: 500 }
    )
  }
}

// Helper functions

/**
 * Calculate the next due date based on the transaction's scheduled day
 */
function getNextDueDate(transaction: any): Date {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const templateDate = new Date(transaction.date)
  const dayOfMonth = templateDate.getDate()

  // Calculate date for current month
  let nextDate = getDateForMonth(now.getFullYear(), now.getMonth(), dayOfMonth)

  // If the date has already passed for this month, next due is next month
  // We use strict inequality: if today is the day, it's considered "due today" (so not next month yet)
  // unless we want to show "Next Due" as future date only.
  // Usually if I pay today(28th), next due is 28th Feb.
  // If I haven't paid yet, and it's 28th... 
  // Let's assume if today > nextDate, then move to next month.
  // If today == nextDate, it's today.

  if (today > nextDate) {
    nextDate = getDateForMonth(now.getFullYear(), now.getMonth() + 1, dayOfMonth)
  }

  return nextDate
}

/**
 * Get a valid date for a specific month/year given a day preference
 * Handles end-of-month clamping (e.g. 31st -> 28th Feb)
 */
function getDateForMonth(year: number, month: number, day: number): Date {
  // Get the last day of the target month
  // new Date(year, month + 1, 0) gives the last day of 'month'
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  const validDay = Math.min(day, lastDayOfMonth)
  return new Date(year, month, validDay)
}

async function shouldGenerateForMonth(supabase: any, templateId: string, userId: string, year: number, month: number): Promise<boolean> {
  // Check if there's already a transaction for this month
  const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0]
  const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0]

  const { data: existingTransactions, error } = await supabase
    .from('transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('recurring_parent_id', templateId)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  if (error) {
    console.error('Error checking existing transactions:', error)
    return false
  }

  // Generate only if no transaction exists for this month
  return !existingTransactions || existingTransactions.length === 0
}

async function generateRecurringInstance(supabase: any, template: any, userId: string, targetDate: Date) {
  try {
    // Create new transaction based on template
    const transactionData = {
      user_id: userId,
      amount: template.amount,
      type: template.type,
      category: template.category,
      description: template.description?.replace('[PAUSED]', '').trim() || null,
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
      console.error('Error generating recurring transaction:', error)
      return null
    }

    return transaction
  } catch (error) {
    console.error('Error in generateRecurringInstance:', error)
    return null
  }
}