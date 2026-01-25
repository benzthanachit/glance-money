import { createClient } from '@/lib/supabase/client'
import { Transaction, Goal, GoalTransaction } from '@/lib/types/database'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface RealtimeConnectionState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  lastConnected: Date | null
  reconnectAttempts: number
}

export interface RealtimeSubscriptionOptions {
  userId: string
  onTransactionInsert?: (transaction: Transaction) => void
  onTransactionUpdate?: (transaction: Transaction) => void
  onTransactionDelete?: (transactionId: string) => void
  onGoalInsert?: (goal: Goal) => void
  onGoalUpdate?: (goal: Goal) => void
  onGoalDelete?: (goalId: string) => void
  onGoalTransactionInsert?: (goalTransaction: GoalTransaction) => void
  onGoalTransactionUpdate?: (goalTransaction: GoalTransaction) => void
  onGoalTransactionDelete?: (goalTransactionId: string) => void
  onConnectionStateChange?: (state: RealtimeConnectionState) => void
}

/**
 * Comprehensive real-time service for managing Supabase subscriptions
 * Handles connection state, reconnection, and multiple table subscriptions
 */
class RealtimeService {
  private supabase = createClient()
  private subscriptions: Map<string, RealtimeChannel> = new Map()
  private connectionState: RealtimeConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0
  }
  private connectionStateListeners: Set<(state: RealtimeConnectionState) => void> = new Set()
  private reconnectTimer: NodeJS.Timeout | null = null
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second

  /**
   * Subscribe to connection state changes
   */
  subscribeToConnectionState(callback: (state: RealtimeConnectionState) => void): () => void {
    this.connectionStateListeners.add(callback)
    // Immediately call with current state
    callback(this.connectionState)
    
    return () => {
      this.connectionStateListeners.delete(callback)
    }
  }

  /**
   * Update connection state and notify listeners
   */
  private updateConnectionState(updates: Partial<RealtimeConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates }
    this.connectionStateListeners.forEach(callback => callback(this.connectionState))
  }

  /**
   * Subscribe to real-time updates for a user
   */
  subscribe(options: RealtimeSubscriptionOptions): () => void {
    const { userId } = options
    const subscriptionKey = `user_${userId}`

    // If already subscribed, unsubscribe first
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey)
    }

    this.updateConnectionState({ isConnecting: true, error: null })

    // Create a single channel for all user data
    const channel = this.supabase
      .channel(`user_data:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Transaction>) => {
          console.log('Transaction inserted:', payload.new)
          if (options.onTransactionInsert && payload.new) {
            options.onTransactionInsert(payload.new as Transaction)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Transaction>) => {
          console.log('Transaction updated:', payload.new)
          if (options.onTransactionUpdate && payload.new) {
            options.onTransactionUpdate(payload.new as Transaction)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Transaction>) => {
          console.log('Transaction deleted:', payload.old)
          if (options.onTransactionDelete && payload.old) {
            options.onTransactionDelete((payload.old as Transaction).id)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Goal>) => {
          console.log('Goal inserted:', payload.new)
          if (options.onGoalInsert && payload.new) {
            options.onGoalInsert(payload.new as Goal)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Goal>) => {
          console.log('Goal updated:', payload.new)
          if (options.onGoalUpdate && payload.new) {
            options.onGoalUpdate(payload.new as Goal)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Goal>) => {
          console.log('Goal deleted:', payload.old)
          if (options.onGoalDelete && payload.old) {
            options.onGoalDelete((payload.old as Goal).id)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'goal_transactions',
        },
        (payload: RealtimePostgresChangesPayload<GoalTransaction>) => {
          console.log('Goal transaction inserted:', payload.new)
          if (options.onGoalTransactionInsert && payload.new) {
            options.onGoalTransactionInsert(payload.new as GoalTransaction)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'goal_transactions',
        },
        (payload: RealtimePostgresChangesPayload<GoalTransaction>) => {
          console.log('Goal transaction updated:', payload.new)
          if (options.onGoalTransactionUpdate && payload.new) {
            options.onGoalTransactionUpdate(payload.new as GoalTransaction)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'goal_transactions',
        },
        (payload: RealtimePostgresChangesPayload<GoalTransaction>) => {
          console.log('Goal transaction deleted:', payload.old)
          if (options.onGoalTransactionDelete && payload.old) {
            options.onGoalTransactionDelete((payload.old as GoalTransaction).id)
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Realtime subscription status:', status, err)
        
        switch (status) {
          case 'SUBSCRIBED':
            this.updateConnectionState({
              isConnected: true,
              isConnecting: false,
              error: null,
              lastConnected: new Date(),
              reconnectAttempts: 0
            })
            // Clear any existing reconnect timer
            if (this.reconnectTimer) {
              clearTimeout(this.reconnectTimer)
              this.reconnectTimer = null
            }
            break
            
          case 'CHANNEL_ERROR':
            this.updateConnectionState({
              isConnected: false,
              isConnecting: false,
              error: err?.message || 'Channel error occurred'
            })
            this.scheduleReconnect(subscriptionKey, options)
            break
            
          case 'TIMED_OUT':
            this.updateConnectionState({
              isConnected: false,
              isConnecting: false,
              error: 'Connection timed out'
            })
            this.scheduleReconnect(subscriptionKey, options)
            break
            
          case 'CLOSED':
            this.updateConnectionState({
              isConnected: false,
              isConnecting: false,
              error: null
            })
            break
        }

        // Notify the subscription options callback if provided
        if (options.onConnectionStateChange) {
          options.onConnectionStateChange(this.connectionState)
        }
      })

    this.subscriptions.set(subscriptionKey, channel)

    // Return unsubscribe function
    return () => {
      this.unsubscribe(subscriptionKey)
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(subscriptionKey: string, options: RealtimeSubscriptionOptions): void {
    if (this.connectionState.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateConnectionState({
        error: `Failed to reconnect after ${this.maxReconnectAttempts} attempts`
      })
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, this.connectionState.reconnectAttempts)
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${this.connectionState.reconnectAttempts + 1})`)
      this.updateConnectionState({
        reconnectAttempts: this.connectionState.reconnectAttempts + 1,
        isConnecting: true
      })
      
      // Remove the old subscription and create a new one
      this.unsubscribe(subscriptionKey)
      this.subscribe(options)
    }, delay)
  }

  /**
   * Manually trigger a reconnection
   */
  reconnect(userId: string, options: RealtimeSubscriptionOptions): void {
    const subscriptionKey = `user_${userId}`
    
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    // Reset reconnect attempts
    this.updateConnectionState({ reconnectAttempts: 0 })
    
    // Unsubscribe and resubscribe
    this.unsubscribe(subscriptionKey)
    this.subscribe(options)
  }

  /**
   * Unsubscribe from a specific subscription
   */
  private unsubscribe(subscriptionKey: string): void {
    const channel = this.subscriptions.get(subscriptionKey)
    if (channel) {
      console.log(`Unsubscribing from ${subscriptionKey}`)
      channel.unsubscribe()
      this.subscriptions.delete(subscriptionKey)
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    console.log('Unsubscribing from all realtime subscriptions')
    this.subscriptions.forEach((channel, key) => {
      channel.unsubscribe()
    })
    this.subscriptions.clear()
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0
    })
  }

  /**
   * Get current connection state
   */
  getConnectionState(): RealtimeConnectionState {
    return { ...this.connectionState }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.connectionState.isConnected
  }

  /**
   * Get the number of active subscriptions
   */
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService()