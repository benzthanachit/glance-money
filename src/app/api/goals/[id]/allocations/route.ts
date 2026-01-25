import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoalTransactionInsert } from '@/lib/types/database'
import { validateTransactionAllocationData, sanitizeTransactionAllocationData } from '@/lib/utils/validation'

// GET /api/goals/[id]/allocations - Get all allocations for a specific goal
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

    const { id: goalId } = await params

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

    // Get allocations with transaction details
    const { data: allocations, error } = await supabase
      .from('goal_transactions')
      .select(`
        id,
        allocated_amount,
        created_at,
        transactions:transaction_id (
          id,
          amount,
          type,
          category,
          description,
          date
        )
      `)
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching goal allocations:', error)
      return NextResponse.json({ error: 'Failed to fetch goal allocations' }, { status: 500 })
    }

    // Transform the data to match our interface
    const transformedAllocations = allocations.map(allocation => ({
      id: allocation.id,
      goalId: goalId,
      transactionId: (allocation.transactions as any).id,
      allocatedAmount: allocation.allocated_amount,
      createdAt: new Date(allocation.created_at),
      transaction: {
        id: (allocation.transactions as any).id,
        amount: (allocation.transactions as any).amount,
        type: (allocation.transactions as any).type,
        category: (allocation.transactions as any).category,
        description: (allocation.transactions as any).description,
        date: new Date((allocation.transactions as any).date),
      }
    }))

    return NextResponse.json({ allocations: transformedAllocations })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/goals/[id]/allocations - Allocate a transaction to a goal
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

    const { id: goalId } = await params

    // Check if goal exists and belongs to user
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('id, target_amount, current_amount')
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

    // Parse and validate request body
    const body = await request.json()
    
    // Validate the allocation data
    const validation = validateTransactionAllocationData(body)
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
    const sanitizedData = sanitizeTransactionAllocationData(body)

    // Check if transaction exists and belongs to user
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('id, amount, type')
      .eq('id', sanitizedData.transactionId)
      .eq('user_id', user.id)
      .single()

    if (transactionError) {
      if (transactionError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }
      console.error('Error checking transaction:', transactionError)
      return NextResponse.json({ error: 'Failed to check transaction' }, { status: 500 })
    }

    // Validate that allocated amount doesn't exceed transaction amount
    if (sanitizedData.allocatedAmount > transaction.amount) {
      return NextResponse.json(
        { error: 'Allocated amount cannot exceed transaction amount' }, 
        { status: 400 }
      )
    }

    // Check if this transaction is already allocated to this goal
    const { data: existingAllocation, error: existingError } = await supabase
      .from('goal_transactions')
      .select('id')
      .eq('goal_id', goalId)
      .eq('transaction_id', sanitizedData.transactionId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing allocation:', existingError)
      return NextResponse.json({ error: 'Failed to check existing allocation' }, { status: 500 })
    }

    if (existingAllocation) {
      return NextResponse.json(
        { error: 'Transaction is already allocated to this goal' }, 
        { status: 400 }
      )
    }

    // Get total allocated amount for this transaction across all goals
    const { data: totalAllocations, error: totalError } = await supabase
      .from('goal_transactions')
      .select('allocated_amount')
      .eq('transaction_id', sanitizedData.transactionId)

    if (totalError) {
      console.error('Error checking total allocations:', totalError)
      return NextResponse.json({ error: 'Failed to check total allocations' }, { status: 500 })
    }

    const totalAllocated = totalAllocations?.reduce((sum, alloc) => sum + alloc.allocated_amount, 0) || 0
    const remainingAmount = transaction.amount - totalAllocated

    if (sanitizedData.allocatedAmount > remainingAmount) {
      return NextResponse.json(
        { 
          error: `Only ${remainingAmount} remaining from this transaction. Already allocated: ${totalAllocated}` 
        }, 
        { status: 400 }
      )
    }

    // Create allocation
    const allocationData: GoalTransactionInsert = {
      goal_id: goalId,
      transaction_id: sanitizedData.transactionId,
      allocated_amount: sanitizedData.allocatedAmount,
    }

    const { data: allocation, error } = await supabase
      .from('goal_transactions')
      .insert(allocationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating allocation:', error)
      return NextResponse.json({ error: 'Failed to create allocation' }, { status: 500 })
    }

    return NextResponse.json({ allocation }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}