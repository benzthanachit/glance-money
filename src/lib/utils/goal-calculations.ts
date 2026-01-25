import { Goal, GoalTransaction } from '@/lib/types/database'
import { GoalWithProgress, GoalSummary } from '@/lib/types'

/**
 * Calculate progress for a single goal
 */
export function calculateGoalProgress(
  goal: Goal,
  allocations: GoalTransaction[]
): GoalWithProgress {
  const currentAmount = allocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0)
  const progressPercentage = goal.target_amount > 0 ? Math.min((currentAmount / goal.target_amount) * 100, 100) : 0
  const remainingAmount = Math.max(goal.target_amount - currentAmount, 0)

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
}

/**
 * Calculate summary statistics for multiple goals
 */
export function calculateGoalsSummary(
  goals: Goal[],
  allAllocations: { goalId: string; allocations: GoalTransaction[] }[]
): GoalSummary {
  const totalGoals = goals.length
  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.target_amount, 0)
  
  let totalCurrentAmount = 0
  let goalsCompleted = 0
  let totalProgress = 0

  for (const goal of goals) {
    const goalAllocations = allAllocations.find(a => a.goalId === goal.id)?.allocations || []
    const currentAmount = goalAllocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0)
    
    totalCurrentAmount += currentAmount

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

  return {
    totalGoals,
    totalTargetAmount,
    totalCurrentAmount,
    averageProgress: Math.round(averageProgress * 100) / 100, // Round to 2 decimal places
    goalsCompleted,
  }
}

/**
 * Validate that an allocation amount is valid for a transaction
 */
export function validateAllocationAmount(
  transactionAmount: number,
  newAllocationAmount: number,
  existingAllocations: GoalTransaction[],
  excludeAllocationId?: string
): { isValid: boolean; error?: string; availableAmount: number } {
  // Calculate total already allocated (excluding the one being updated if provided)
  const totalAllocated = existingAllocations
    .filter(allocation => allocation.id !== excludeAllocationId)
    .reduce((sum, allocation) => sum + allocation.allocated_amount, 0)

  const availableAmount = transactionAmount - totalAllocated

  if (newAllocationAmount > availableAmount) {
    return {
      isValid: false,
      error: `Only ${availableAmount} available from this transaction. Already allocated: ${totalAllocated}`,
      availableAmount,
    }
  }

  if (newAllocationAmount > transactionAmount) {
    return {
      isValid: false,
      error: 'Allocated amount cannot exceed transaction amount',
      availableAmount,
    }
  }

  return {
    isValid: true,
    availableAmount,
  }
}

/**
 * Check if a goal is completed
 */
export function isGoalCompleted(goal: Goal, allocations: GoalTransaction[]): boolean {
  const currentAmount = allocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0)
  return currentAmount >= goal.target_amount
}

/**
 * Get goal completion percentage
 */
export function getGoalCompletionPercentage(goal: Goal, allocations: GoalTransaction[]): number {
  const currentAmount = allocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0)
  const progressPercentage = goal.target_amount > 0 ? Math.min((currentAmount / goal.target_amount) * 100, 100) : 0
  return Math.round(progressPercentage * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate days remaining until goal deadline
 */
export function getDaysUntilDeadline(deadline: Date): number {
  const today = new Date()
  const timeDiff = deadline.getTime() - today.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

/**
 * Check if goal deadline is approaching (within 30 days)
 */
export function isDeadlineApproaching(deadline: Date): boolean {
  const daysRemaining = getDaysUntilDeadline(deadline)
  return daysRemaining <= 30 && daysRemaining > 0
}

/**
 * Check if goal deadline has passed
 */
export function isDeadlinePassed(deadline: Date): boolean {
  return getDaysUntilDeadline(deadline) < 0
}