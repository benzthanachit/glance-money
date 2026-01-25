import { useEffect, useState } from 'react'
import { Transaction } from '@/lib/types/database'
import { realtimeService, RealtimeConnectionState } from '@/lib/services/realtimeService'

interface UseTransactionSubscriptionProps {
  userId?: string
  onInsert?: (transaction: Transaction) => void
  onUpdate?: (transaction: Transaction) => void
  onDelete?: (transactionId: string) => void
}

interface UseTransactionSubscriptionReturn {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  reconnectAttempts: number
  lastConnected: Date | null
  reconnect: () => void
}

export function useTransactionSubscription({
  userId,
  onInsert,
  onUpdate,
  onDelete,
}: UseTransactionSubscriptionProps): UseTransactionSubscriptionReturn {
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0
  })

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

    // Subscribe to connection state changes
    const unsubscribeConnectionState = realtimeService.subscribeToConnectionState(
      (state) => setConnectionState(state)
    )

    // Subscribe to real-time updates
    const unsubscribeRealtime = realtimeService.subscribe({
      userId,
      onTransactionInsert: onInsert,
      onTransactionUpdate: onUpdate,
      onTransactionDelete: onDelete,
      onConnectionStateChange: setConnectionState
    })

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeConnectionState()
      unsubscribeRealtime()
    }
  }, [userId, onInsert, onUpdate, onDelete])

  const reconnect = () => {
    if (userId) {
      realtimeService.reconnect(userId, {
        userId,
        onTransactionInsert: onInsert,
        onTransactionUpdate: onUpdate,
        onTransactionDelete: onDelete,
        onConnectionStateChange: setConnectionState
      })
    }
  }

  return {
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    error: connectionState.error,
    reconnectAttempts: connectionState.reconnectAttempts,
    lastConnected: connectionState.lastConnected,
    reconnect
  }
}