import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // Get all generated instances of the recurring transaction directly from database
    const { data: instances, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('recurring_parent_id', id)
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch recurring transaction instances: ${error.message}`)
    }

    return NextResponse.json({ instances: instances || [] })
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
      return NextResponse.json(
        { error: 'Recurring transaction not found' }, 
        { status: 404 }
      )
    }

    // Update the template directly in database
    const { data: updatedTransaction, error } = await supabase
      .from('transactions')
      .update({
        ...sanitizedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update recurring transaction: ${error.message}`)
    }

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

    return NextResponse.json({ message: 'Recurring transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting recurring transaction:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete recurring transaction' }, 
      { status: 500 }
    )
  }
}