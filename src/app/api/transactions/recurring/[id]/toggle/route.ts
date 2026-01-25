import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      return NextResponse.json(
        { error: 'Recurring transaction not found' }, 
        { status: 404 }
      )
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

    const isActive = !updatedTransaction.description?.includes('[PAUSED]')

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