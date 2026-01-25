import { useEffect, useState, useCallback } from 'react'
import { Transaction, Goal, GoalTransaction } from '@/lib/types/database'
import { realtimeService, RealtimeConnectionState } from '@/lib/services/realtimeService'
import { financialService } from '@/lib/services/financialService'
import { goalService } from '@/lib/services/goalService'

interface UseRealtimeUpdatesProps {
  userId?: string
  enableOptimisticUpdates?: boolean
}

interface UseRealtimeUpdatesReturn {
  connectionState: RealtimeConnectionState
  reconnect: () => void
  isConnected: boolean
  error: string | null
}

/**
 * Comprehensive hook for managing real-time updates across the application
 * Handles transactions, goals, and goal transactions with optimistic updates
 */
export function useRealtimeUpdates({
  userId,
  enableOptimisticUpdates = true
}: UseRealtimeUpdatesProps): UseRealtimeUpdatesReturn {
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0
  })

  // Optimistic update state for transactions
  const [optimisticTransactions, setOptimisticTransactions] = useState<Map<string, Transaction>>(new Map())
  const [optimisticGoals, setOptimisticGoals] = useState<Map<string, Goal>>(new Map())

  // Handle transaction insertions
  const handleTransactionInsert = useCallback((transaction: Transaction) => {
    console.log('Real-time transaction insert:', transaction)
    
    // Remove from optimistic updates if it exists
    if (optimisticTransactions.has(transaction.id)) {
      setOptimisticTransactions(prev => {
        const newMap = new Map(prev)
        newMap.delete(transaction.id)
        return newMap
      })
    }
    
    // Refresh financial data to reflect the new transaction
    financialService.refresh().catch(error => {
      console.error('Failed to refresh financial data after transaction insert:', error)
    })
  }, [optimisticTransactions])

  // Handle transaction updates
  const handleTransactionUpdate = useCallback((transaction: Transaction) => {
    console.log('Real-time transaction update:', transaction)
    
    // Remove from optimistic updates if it exists
    if (optimisticTransactions.has(transaction.id)) {
      setOptimisticTransactions(prev => {
        const newMap = new Map(prev)
        newMap.delete(transaction.id)
        return newMap
      })
    }
    
    // Refresh financial data to reflect the updated transaction
    financialService.refresh().catch(error => {
      console.error('Failed to refresh financial data after transaction update:', error)
    })
  }, [optimisticTransactions])

  // Handle transaction deletions
  const handleTransactionDelete = useCallback((transactionId: string) => {
    console.log('Real-time transaction delete:', transactionId)
    
    // Remove from optimistic updates if it exists
    if (optimisticTransactions.has(transactionId)) {
      setOptimisticTransactions(prev => {
        const newMap = new Map(prev)
        newMap.delete(transactionId)
        return newMap
      })
    }
    
    // Refresh financial data to reflect the deleted transaction
    financialService.refresh().catch(error => {
      console.error('Failed to refresh financial data after transaction delete:', error)
    })
  }, [optimisticTransactions])

  // Handle goal insertions
  const handleGoalInsert = useCallback((goal: Goal) => {
    console.log('Real-time goal insert:', goal)
    
    // Remove from optimistic updates if it exists
    if (optimisticGoals.has(goal.id)) {
      setOptimisticGoals(prev => {
        const newMap = new Map(prev)
        newMap.delete(goal.id)
        return newMap
      })
    }
    
    // Refresh goal data
    // Note: This would trigger any goal-related hooks to refresh
    console.log('Goal inserted, refreshing goal data')
  }, [optimisticGoals])

  // Handle goal updates
  const handleGoalUpdate = useCallback((goal: Goal) => {
    console.log('Real-time goal update:', goal)
    
    // Remove from optimistic updates if it exists
    if (optimisticGoals.has(goal.id)) {
      setOptimisticGoals(prev => {
        const newMap = new Map(prev)
        newMap.delete(goal.id)
        return newMap
      })
    }
    
    // Refresh goal data
    console.log('Goal updated, refreshing goal data')
  }, [optimisticGoals])

  // Handle goal deletions
  const handleGoalDelete = useCallback((goalId: string) => {
    console.log('Real-time goal delete:', goalId)
    
    // Remove from optimistic updates if it exists
    if (optimisticGoals.has(goalId)) {
      setOptimisticGoals(prev => {
        const newMap = new Map(prev)
        newMap.delete(goalId)
        return newMap
      })
    }
    
    // Refresh goal data
    console.log('Goal deleted, refreshing goal data')
  }, [optimisticGoals])

  // Handle goal transaction changes
  const handleGoalTransactionInsert = useCallback((goalTransaction: GoalTransaction) => {
    console.log('Real-time goal transaction insert:', goalTransaction)
    
    // Refresh both financial and goal data since goal allocations affect both
    Promise.all([
      financialService.refresh(),
      // Goal service refresh would go here
    ]).catch(error => {
      console.error('Failed to refresh data after goal transaction insert:', error)
    })
  }, [])

  const handleGoalTransactionUpdate = useCallback((goalTransaction: GoalTransaction) => {
    console.log('Real-time goal transaction update:', goalTransaction)
    
    // Refresh both financial and goal data
    Promise.all([
      financialService.refresh(),
      // Goal service refresh would go here
    ]).catch(error => {
      console.error('Failed to refresh data after goal transaction update:', error)
    })
  }, [])

  const handleGoalTransactionDelete = useCallback((goalTransactionId: string) => {
    console.log('Real-time goal transaction delete:', goalTransactionId)
    
    // Refresh both financial and goal data
    Promise.all([
      financialService.refresh(),
      // Goal service refresh would go here
    ]).catch(error => {
      console.error('Failed to refresh data after goal transaction delete:', error)
    })
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) {
      setConnectionState({
        isConnected: false,
        isConnecting: false,
        error: null,
        lastConnected: null,
        reconnectAttempts: 0
      })
      return
    }

    console.log('Setting up real-time subscriptions for user:', userId)

    // Subscribe to connection state changes
    const unsubscribeConnectionState = realtimeService.subscribeToConnectionState(
      (state) => {
        console.log('Connection state changed:', state)
        setConnectionState(state)
      }
    )

    // Subscribe to all real-time updates
    const unsubscribeRealtime = realtimeService.subscribe({
      userId,
      onTransactionInsert: handleTransactionInsert,
      onTransactionUpdate: handleTransactionUpdate,
      onTransactionDelete: handleTransactionDelete,
      onGoalInsert: handleGoalInsert,
      onGoalUpdate: handleGoalUpdate,
      onGoalDelete: handleGoalDelete,
      onGoalTransactionInsert: handleGoalTransactionInsert,
      onGoalTransactionUpdate: handleGoalTransactionUpdate,
      onGoalTransactionDelete: handleGoalTransactionDelete,
      onConnectionStateChange: setConnectionState
    })

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up real-time subscriptions')
      unsubscribeConnectionState()
      unsubscribeRealtime()
    }
  }, [
    userId,
    handleTransactionInsert,
    handleTransactionUpdate,
    handleTransactionDelete,
    handleGoalInsert,
    handleGoalUpdate,
    handleGoalDelete,
    handleGoalTransactionInsert,
    handleGoalTransactionUpdate,
    handleGoalTransactionDelete
  ])

  // Reconnect function
  const reconnect = useCallback(() => {
    if (userId) {
      console.log('Manually reconnecting real-time subscriptions')
      realtimeService.reconnect(userId, {
        userId,
        onTransactionInsert: handleTransactionInsert,
        onTransactionUpdate: handleTransactionUpdate,
        onTransactionDelete: handleTransactionDelete,
        onGoalInsert: handleGoalInsert,
        onGoalUpdate: handleGoalUpdate,
        onGoalDelete: handleGoalDelete,
        onGoalTransactionInsert: handleGoalTransactionInsert,
        onGoalTransactionUpdate: handleGoalTransactionUpdate,
        onGoalTransactionDelete: handleGoalTransactionDelete,
        onConnectionStateChange: setConnectionState
      })
    }
  }, [
    userId,
    handleTransactionInsert,
    handleTransactionUpdate,
    handleTransactionDelete,
    handleGoalInsert,
    handleGoalUpdate,
    handleGoalDelete,
    handleGoalTransactionInsert,
    handleGoalTransactionUpdate,
    handleGoalTransactionDelete
  ])

  // Optimistic update functions (for use by components)
  const addOptimisticTransaction = useCallback((transaction: Transaction) => {
    if (enableOptimisticUpdates) {
      setOptimisticTransactions(prev => new Map(prev).set(transaction.id, transaction))
      
      // Immediately update financial calculations with optimistic data
      // This would need to be implemented in the financial service
      console.log('Added optimistic transaction:', transaction)
    }
  }, [enableOptimisticUpdates])

  const addOptimisticGoal = useCallback((goal: Goal) => {
    if (enableOptimisticUpdates) {
      setOptimisticGoals(prev => new Map(prev).set(goal.id, goal))
      console.log('Added optimistic goal:', goal)
    }
  }, [enableOptimisticUpdates])

  return {
    connectionState,
    reconnect,
    isConnected: connectionState.isConnected,
    error: connectionState.error
  }
}

/**
 * Hook specifically for transaction real-time updates with optimistic UI
 */
export function useTransactionRealtimeUpdates(userId?: string) {
  return useRealtimeUpdates({ userId, enableOptimisticUpdates: true })
}

/**
 * Hook for connection state monitoring only
 */
export function useRealtimeConnectionState() {
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0
  })

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToConnectionState(setConnectionState)
    return unsubscribe
  }, [])

  return connectionState
}