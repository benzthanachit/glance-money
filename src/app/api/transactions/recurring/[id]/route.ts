import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recurringTransactionService } from '@/lib/services/recurringTransactionService'
import { validateTransactionUpdateData, sanitizeTransactionUpdateData } from '@/lib/utils/validation'

// GET /api/transactions/recurring/[id] - Get recurring transaction instances
export async function GET(
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

    const instances = await recurringTransactionService.getRecurringTransactionInstances(id)

    return NextResponse.json({ instances })
  } catch (error) {
    console.error('Error fetching recurring transaction instances:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recurring transaction instances' }, 
      { status: 500 }
    )
  }
}

// PUT /api/transactions/recurring/[id] - Update recurring transaction template
export async function PUT(
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
    const body = await request.json()

    // Validate the update data
    const validation = validateTransactionUpdateData(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        }, 
        { status: 400 }
      )
    }

    // Sanitize the data
    const sanitizedData = sanitizeTransactionUpdateData(body)

    const updatedTransaction = await recurringTransactionService.updateRecurringTransaction(id, sanitizedData)

    return NextResponse.json({ transaction: updatedTransaction })
  } catch (error) {
    console.error('Error updating recurring transaction:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update recurring transaction' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/transactions/recurring/[id] - Delete recurring transaction template
export async function DELETE(
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
    
    // Get query parameter to determine if instances should be deleted
    const { searchParams } = new URL(request.url)
    const deleteInstances = searchParams.get('deleteInstances') === 'true'

    await recurringTransactionService.deleteRecurringTransaction(id, deleteInstances)

    return NextResponse.json({ message: 'Recurring transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting recurring transaction:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete recurring transaction' }, 
      { status: 500 }
    )
  }
}