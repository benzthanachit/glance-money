import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoalSummary } from '@/lib/types'

// GET /api/goals/summary - Get goals summary for authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all goals for the user
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, target_amount, current_amount')
      .eq('user_id', user.id)

    if (goalsError) {
      console.error('Error fetching goals for summary:', goalsError)
      return NextResponse.json({ error: 'Failed to fetch goals summary' }, { status: 500 })
    }

    // Calculate summary statistics
    const totalGoals = goals.length
    const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.target_amount, 0)
    
    // Calculate current amounts by getting actual allocations
    let totalCurrentAmount = 0
    let goalsCompleted = 0
    let totalProgress = 0

    for (const goal of goals) {
      // Get allocated transactions for this goal
      const { data: allocations, error: allocError } = await supabase
        .from('goal_transactions')
        .select('allocated_amount')
        .eq('goal_id', goal.id)

      if (allocError) {
        console.error('Error fetching allocations for goal summary:', allocError)
        continue
      }

      const currentAmount = allocations?.reduce((sum, allocation) => sum + allocation.allocated_amount, 0) || 0
      totalCurrentAmount += currentAmount

      // Update current_amount in database
      await supabase
        .from('goals')
        .update({ current_amount: currentAmount })
        .eq('id', goal.id)

      // Check if goal is completed
      if (currentAmount >= goal.target_amount) {
        goalsCompleted++
      }

      // Calculate progress percentage for this goal
      const progressPercentage = goal.target_amount > 0 ? Math.min((currentAmount / goal.target_amount) * 100, 100) : 0
      totalProgress += progressPercentage
    }

    // Calculate average progress
    const averageProgress = totalGoals > 0 ? totalProgress / totalGoals : 0

    const summary: GoalSummary = {
      totalGoals,
      totalTargetAmount,
      totalCurrentAmount,
      averageProgress: Math.round(averageProgress * 100) / 100, // Round to 2 decimal places
      goalsCompleted,
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}