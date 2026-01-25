import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT /api/goals/[id]/allocations/[allocationId] - Update allocation amount
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; allocationId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: goalId, allocationId } = await params

    // Check if goal exists and belongs to user
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('id')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single()

    if (goalError) {
      if (goalError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
      }
      console.error('Error checking goal:', goalError)
      return NextResponse.json({ error: 'Failed to check goal' }, { status: 500 })
    }

    // Get existing allocation
    const { data: existingAllocation, error: allocationError } = await supabase
      .from('goal_transactions')
      .select(`
        id,
        allocated_amount,
        transaction_id,
        transactions:transaction_id (amount)
      `)
      .eq('id', allocationId)
      .eq('goal_id', goalId)
      .single()

    if (allocationError) {
      if (allocationError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Allocation not found' }, { status: 404 })
      }
      console.error('Error checking allocation:', allocationError)
      return NextResponse.json({ error: 'Failed to check allocation' }, { status: 500 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { allocatedAmount } = body

    // Validate allocated amount
    if (!allocatedAmount || typeof allocatedAmount !== 'number' || allocatedAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid allocated amount is required' }, 
        { status: 400 }
      )
    }

    if (allocatedAmount > 999999999.99) {
      return NextResponse.json(
        { error: 'Allocated amount is too large' }, 
        { status: 400 }
      )
    }

    // Check transaction amount limit
    const transactionAmount = (existingAllocation.transactions as any).amount
    if (allocatedAmount > transactionAmount) {
      return NextResponse.json(
        { error: 'Allocated amount cannot exceed transaction amount' }, 
        { status: 400 }
      )
    }

    // Get total allocated amount for this transaction across all OTHER goals
    const { data: otherAllocations, error: otherError } = await supabase
      .from('goal_transactions')
      .select('allocated_amount')
      .eq('transaction_id', existingAllocation.transaction_id)
      .neq('id', allocationId) // Exclude current allocation

    if (otherError) {
      console.error('Error checking other allocations:', otherError)
      return NextResponse.json({ error: 'Failed to check other allocations' }, { status: 500 })
    }

    const otherAllocatedAmount = otherAllocations?.reduce((sum, alloc) => sum + alloc.allocated_amount, 0) || 0
    const availableAmount = transactionAmount - otherAllocatedAmount

    if (allocatedAmount > availableAmount) {
      return NextResponse.json(
        { 
          error: `Only ${availableAmount} available from this transaction. Other allocations: ${otherAllocatedAmount}` 
        }, 
        { status: 400 }
      )
    }

    // Update allocation
    const { data: allocation, error } = await supabase
      .from('goal_transactions')
      .update({ allocated_amount: allocatedAmount })
      .eq('id', allocationId)
      .eq('goal_id', goalId)
      .select()
      .single()

    if (error) {
      console.error('Error updating allocation:', error)
      return NextResponse.json({ error: 'Failed to update allocation' }, { status: 500 })
    }

    return NextResponse.json({ allocation })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/goals/[id]/allocations/[allocationId] - Remove allocation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; allocationId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: goalId, allocationId } = await params

    // Check if goal exists and belongs to user
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('id')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single()

    if (goalError) {
      if (goalError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
      }
      console.error('Error checking goal:', goalError)
      return NextResponse.json({ error: 'Failed to check goal' }, { status: 500 })
    }

    // Check if allocation exists
    const { data: existingAllocation, error: allocationError } = await supabase
      .from('goal_transactions')
      .select('id')
      .eq('id', allocationId)
      .eq('goal_id', goalId)
      .single()

    if (allocationError) {
      if (allocationError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Allocation not found' }, { status: 404 })
      }
      console.error('Error checking allocation:', allocationError)
      return NextResponse.json({ error: 'Failed to check allocation' }, { status: 500 })
    }

    // Delete allocation
    const { error } = await supabase
      .from('goal_transactions')
      .delete()
      .eq('id', allocationId)
      .eq('goal_id', goalId)

    if (error) {
      console.error('Error deleting allocation:', error)
      return NextResponse.json({ error: 'Failed to delete allocation' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Allocation removed successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}