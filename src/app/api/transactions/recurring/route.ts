import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recurringTransactionService } from '@/lib/services/recurringTransactionService'

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

    const filters = {
      ...(type && { type }),
      ...(category && { category }),
    }

    const recurringTransactions = await recurringTransactionService.getRecurringTransactions(filters)

    // Add status information to each recurring transaction
    const enrichedTransactions = recurringTransactions.map(transaction => ({
      ...transaction,
      isActive: recurringTransactionService.isRecurringTransactionActive(transaction),
      nextDueDate: recurringTransactionService.getNextDueDate(transaction),
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

    const generatedTransactions = await recurringTransactionService.generateMonthlyRecurringTransactions()

    return NextResponse.json({ 
      message: `Generated ${generatedTransactions.length} recurring transactions`,
      transactions: generatedTransactions 
    })
  } catch (error) {
    console.error('Error generating recurring transactions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recurring transactions' }, 
      { status: 500 }
    )
  }
}