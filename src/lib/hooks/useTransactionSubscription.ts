import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Transaction } from '@/lib/types/database'

interface UseTransactionSubscriptionProps {
  userId?: string
  onInsert?: (transaction: Transaction) => void
  onUpdate?: (transaction: Transaction) => void
  onDelete?: (transactionId: string) => void
}

export function useTransactionSubscription({
  userId,
  onInsert,
  onUpdate,
  onDelete,
}: UseTransactionSubscriptionProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    
    // Subscribe to transaction changes for the specific user
    const subscription = supabase
      .channel(`transactions:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Transaction inserted:', payload.new)
          if (onInsert && payload.new) {
            onInsert(payload.new as Transaction)
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
        (payload) => {
          console.log('Transaction updated:', payload.new)
          if (onUpdate && payload.new) {
            onUpdate(payload.new as Transaction)
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
        (payload) => {
          console.log('Transaction deleted:', payload.old)
          if (onDelete && payload.old) {
            onDelete(payload.old.id)
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setError(null)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setError('Failed to connect to real-time updates')
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false)
          setError('Connection timed out')
        } else if (status === 'CLOSED') {
          setIsConnected(false)
          setError(null)
        }
      })

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from transaction updates')
      subscription.unsubscribe()
    }
  }, [userId, onInsert, onUpdate, onDelete])

  return { isConnected, error }
}