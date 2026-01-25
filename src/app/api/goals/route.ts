import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoalInsert } from '@/lib/types/database'
import { GoalWithProgress, GoalSummary } from '@/lib/types'
import { validateGoalData, sanitizeGoalData } from '@/lib/utils/validation'
import { ensureUserProfile } from '@/lib/utils/user'

// GET /api/goals - Get all goals for authenticated user with progress calculation
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
    const completed = searchParams.get('completed')
    const hasDeadline = searchParams.get('hasDeadline')
    const limit = searchParams.get('limit')

    // Build query for goals
    let query = supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (completed !== null) {
      const isCompleted = completed === 'true'
      if (isCompleted) {
        query = query.gte('current_amount', supabase.rpc('target_amount'))
      } else {
        query = query.lt('current_amount', supabase.rpc('target_amount'))
      }
    }

    if (hasDeadline !== null) {
      const hasDeadlineFilter = hasDeadline === 'true'
      if (hasDeadlineFilter) {
        query = query.not('deadline', 'is', null)
      } else {
        query = query.is('deadline', null)
      }
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: goals, error } = await query

    if (error) {
      console.error('Error fetching goals:', error)
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
    }

    // Calculate progress for each goal
    const goalsWithProgress: GoalWithProgress[] = await Promise.all(
      goals.map(async (goal) => {
        // Get allocated transactions for this goal
        const { data: allocations, error: allocError } = await supabase
          .from('goal_transactions')
          .select('allocated_amount')
          .eq('goal_id', goal.id)

        if (allocError) {
          console.error('Error fetching goal allocations:', allocError)
          // Continue with zero current amount if allocation fetch fails
        }

        const currentAmount = allocations?.reduce((sum, allocation) => sum + allocation.allocated_amount, 0) || 0
        const progressPercentage = goal.target_amount > 0 ? Math.min((currentAmount / goal.target_amount) * 100, 100) : 0
        const remainingAmount = Math.max(goal.target_amount - currentAmount, 0)

        // Update current_amount in database
        await supabase
          .from('goals')
          .update({ current_amount: currentAmount })
          .eq('id', goal.id)

        return {
          id: goal.id,
          userId: goal.user_id,
          name: goal.name,
          targetAmount: goal.target_amount,
          currentAmount,
          deadline: goal.deadline ? new Date(goal.deadline) : undefined,
          createdAt: new Date(goal.created_at),
          updatedAt: new Date(goal.updated_at),
          progressPercentage: Math.round(progressPercentage * 100) / 100, // Round to 2 decimal places
          remainingAmount,
        }
      })
    )

    return NextResponse.json({ goals: goalsWithProgress })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/goals - Create new goal
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user profile exists
    try {
      await ensureUserProfile(user.id, user.email || '')
    } catch (error) {
      console.error('Failed to ensure user profile:', error)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate the goal data
    const validation = validateGoalData(body)
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
    const sanitizedData = sanitizeGoalData(body)
    
    // Prepare goal data
    const goalData: GoalInsert = {
      user_id: user.id,
      name: sanitizedData.name,
      target_amount: sanitizedData.targetAmount,
      current_amount: 0, // Always start with 0
      deadline: sanitizedData.deadline || null,
    }

    // Insert goal
    const { data: goal, error } = await supabase
      .from('goals')
      .insert(goalData)
      .select()
      .single()

    if (error) {
      console.error('Error creating goal:', error)
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
    }

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}