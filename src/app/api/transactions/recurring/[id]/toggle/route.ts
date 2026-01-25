import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recurringTransactionService } from '@/lib/services/recurringTransactionService'

// POST /api/transactions/recurring/[id]/toggle - Toggle recurring transaction active/inactive
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const updatedTransaction = await recurringTransactionService.toggleRecurringTransaction(id)
    const isActive = recurringTransactionService.isRecurringTransactionActive(updatedTransaction)

    return NextResponse.json({ 
      transaction: updatedTransaction,
      isActive,
      message: `Recurring transaction ${isActive ? 'activated' : 'paused'} successfully`
    })
  } catch (error) {
    console.error('Error toggling recurring transaction:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle recurring transaction' }, 
      { status: 500 }
    )
  }
}