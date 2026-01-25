import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoalUpdate } from '@/lib/types/database'
import { GoalWithProgress } from '@/lib/types'
import { validateGoalUpdateData, sanitizeGoalUpdateData } from '@/lib/utils/validation'

// GET /api/goals/[id] - Get specific goal with progress calculation
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

    // Get goal
    const { data: goal, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
      }
      console.error('Error fetching goal:', error)
      return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 })
    }

    // Get allocated transactions for this goal
    const { data: allocations, error: allocError } = await supabase
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

    if (allocError) {
      console.error('Error fetching goal allocations:', allocError)
      return NextResponse.json({ error: 'Failed to fetch goal allocations' }, { status: 500 })
    }

    // Calculate progress
    const currentAmount = allocations?.reduce((sum, allocation) => sum + allocation.allocated_amount, 0) || 0
    const progressPercentage = goal.target_amount > 0 ? Math.min((currentAmount / goal.target_amount) * 100, 100) : 0
    const remainingAmount = Math.max(goal.target_amount - currentAmount, 0)

    // Update current_amount in database
    await supabase
      .from('goals')
      .update({ current_amount: currentAmount })
      .eq('id', goalId)

    const goalWithProgress: GoalWithProgress = {
      id: goal.id,
      userId: goal.user_id,
      name: goal.name,
      targetAmount: goal.target_amount,
      currentAmount,
      deadline: goal.deadline ? new Date(goal.deadline) : undefined,
      createdAt: new Date(goal.created_at),
      updatedAt: new Date(goal.updated_at),
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      remainingAmount,
      allocatedTransactions: allocations?.map(allocation => ({
        id: allocation.id,
        goalId: goalId,
        transactionId: (allocation.transactions as any).id,
        allocatedAmount: allocation.allocated_amount,
        createdAt: new Date(allocation.created_at),
      })) || [],
    }

    return NextResponse.json({ goal: goalWithProgress })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/goals/[id] - Update goal
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

    const { id: goalId } = await params

    // Check if goal exists and belongs to user
    const { data: existingGoal, error: checkError } = await supabase
      .from('goals')
      .select('id')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
      }
      console.error('Error checking goal:', checkError)
      return NextResponse.json({ error: 'Failed to check goal' }, { status: 500 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate the update data
    const validation = validateGoalUpdateData(body)
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
    const sanitizedData = sanitizeGoalUpdateData(body)
    
    // Prepare update data
    const updateData: GoalUpdate = {
      ...sanitizedData,
      updated_at: new Date().toISOString(),
    }

    // Update goal
    const { data: goal, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating goal:', error)
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/goals/[id] - Delete goal
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

    const { id: goalId } = await params

    // Check if goal exists and belongs to user
    const { data: existingGoal, error: checkError } = await supabase
      .from('goals')
      .select('id')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
      }
      console.error('Error checking goal:', checkError)
      return NextResponse.json({ error: 'Failed to check goal' }, { status: 500 })
    }

    // Delete all goal-transaction allocations first (cascade delete)
    const { error: allocationsError } = await supabase
      .from('goal_transactions')
      .delete()
      .eq('goal_id', goalId)

    if (allocationsError) {
      console.error('Error deleting goal allocations:', allocationsError)
      return NextResponse.json({ error: 'Failed to delete goal allocations' }, { status: 500 })
    }

    // Delete goal
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting goal:', error)
      return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}