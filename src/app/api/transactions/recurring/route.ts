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
      nextDueDate: getNextDueDate().toISOString(), // Convert to string to avoid hydration issues
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
        const newTransaction = await generateRecurringInstance(supabase, template, user.id, currentDate)
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
function getNextDueDate(): Date {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // For monthly recurring transactions, the next due date is the first of next month
  return new Date(currentYear, currentMonth + 1, 1)
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