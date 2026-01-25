import { Goal, GoalInsert, GoalUpdate, GoalTransaction, GoalTransactionInsert } from '@/lib/types/database'
import { GoalWithProgress, GoalSummary } from '@/lib/types'

export interface CreateGoalData {
  name: string
  targetAmount: number
  deadline?: string
}

export interface UpdateGoalData {
  name?: string
  targetAmount?: number
  deadline?: string | null
}

export interface AllocateTransactionData {
  transactionId: string
  allocatedAmount: number
}

export interface GoalFilters {
  completed?: boolean
  hasDeadline?: boolean
  limit?: number
}

class GoalService {
  private baseUrl = '/api/goals'

  async getGoals(filters?: GoalFilters): Promise<GoalWithProgress[]> {
    const params = new URLSearchParams()
    
    if (filters?.completed !== undefined) params.append('completed', filters.completed.toString())
    if (filters?.hasDeadline !== undefined) params.append('hasDeadline', filters.hasDeadline.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch goals')
    }

    const data = await response.json()
    return data.goals
  }

  async getGoal(id: string): Promise<GoalWithProgress> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch goal')
    }

    const data = await response.json()
    return data.goal
  }

  async createGoal(goalData: CreateGoalData): Promise<Goal> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(goalData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create goal')
    }

    const data = await response.json()
    return data.goal
  }

  async updateGoal(id: string, updateData: UpdateGoalData): Promise<Goal> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update goal')
    }

    const data = await response.json()
    return data.goal
  }

  async deleteGoal(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete goal')
    }
  }

  async getGoalSummary(): Promise<GoalSummary> {
    const response = await fetch(`${this.baseUrl}/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch goal summary')
    }

    const data = await response.json()
    return data.summary
  }

  // Goal-Transaction allocation methods
  async allocateTransactionToGoal(goalId: string, allocationData: AllocateTransactionData): Promise<GoalTransaction> {
    const response = await fetch(`${this.baseUrl}/${goalId}/allocations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(allocationData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to allocate transaction to goal')
    }

    const data = await response.json()
    return data.allocation
  }

  async removeTransactionAllocation(goalId: string, allocationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${goalId}/allocations/${allocationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to remove transaction allocation')
    }
  }

  async getGoalAllocations(goalId: string): Promise<GoalTransaction[]> {
    const response = await fetch(`${this.baseUrl}/${goalId}/allocations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch goal allocations')
    }

    const data = await response.json()
    return data.allocations
  }

  async updateTransactionAllocation(
    goalId: string, 
    allocationId: string, 
    allocatedAmount: number
  ): Promise<GoalTransaction> {
    const response = await fetch(`${this.baseUrl}/${goalId}/allocations/${allocationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ allocatedAmount }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update transaction allocation')
    }

    const data = await response.json()
    return data.allocation
  }
}

export const goalService = new GoalService()