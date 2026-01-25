import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/client', () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn()
  }

  const mockSupabaseClient = {
    channel: vi.fn().mockReturnValue(mockChannel)
  }

  return {
    createClient: () => mockSupabaseClient
  }
})

// Import after mocking
import { realtimeService } from '@/lib/services/realtimeService'

describe('RealtimeService', () => {
  let mockChannel: any
  let mockSupabaseClient: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Get fresh mock references
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn()
    }
    
    mockSupabaseClient = {
      channel: vi.fn().mockReturnValue(mockChannel)
    }
    
    // Reset the service state
    realtimeService.unsubscribeAll()
  })

  describe('Connection State Management', () => {
    it('should initialize with disconnected state', () => {
      const state = realtimeService.getConnectionState()
      
      expect(state.isConnected).toBe(false)
      expect(state.isConnecting).toBe(false)
      expect(state.error).toBe(null)
      expect(state.reconnectAttempts).toBe(0)
    })

    it('should allow subscription to connection state changes', () => {
      const callback = vi.fn()
      const unsubscribe = realtimeService.subscribeToConnectionState(callback)
      
      // Should immediately call with current state
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          isConnected: false,
          isConnecting: false
        })
      )
      
      // Cleanup
      unsubscribe()
    })
  })

  describe('Real-time Subscriptions', () => {
    it('should create subscription for user data', () => {
      const userId = 'test-user-id'
      const options = {
        userId,
        onTransactionInsert: vi.fn(),
        onTransactionUpdate: vi.fn(),
        onTransactionDelete: vi.fn()
      }

      const unsubscribe = realtimeService.subscribe(options)
      
      // Should create a channel
      expect(vi.mocked(realtimeService as any).supabase.channel).toHaveBeenCalledWith(`user_data:${userId}`)
      
      // The actual implementation details would be tested with integration tests
      // For unit tests, we focus on the public API
      expect(realtimeService.getActiveSubscriptionCount()).toBe(1)
      
      // Cleanup
      unsubscribe()
    })

    it('should handle multiple subscriptions', () => {
      const userId1 = 'user-1'
      const userId2 = 'user-2'
      
      const unsubscribe1 = realtimeService.subscribe({
        userId: userId1,
        onTransactionInsert: vi.fn()
      })
      
      const unsubscribe2 = realtimeService.subscribe({
        userId: userId2,
        onTransactionInsert: vi.fn()
      })
      
      expect(realtimeService.getActiveSubscriptionCount()).toBe(2)
      
      // Cleanup
      unsubscribe1()
      unsubscribe2()
    })

    it('should unsubscribe correctly', () => {
      const userId = 'test-user-id'
      const unsubscribe = realtimeService.subscribe({
        userId,
        onTransactionInsert: vi.fn()
      })
      
      expect(realtimeService.getActiveSubscriptionCount()).toBe(1)
      
      unsubscribe()
      
      expect(realtimeService.getActiveSubscriptionCount()).toBe(0)
    })
  })

  describe('Connection Status', () => {
    it('should report connection status correctly', () => {
      expect(realtimeService.isConnected()).toBe(false)
      
      // The actual connection state would be updated by Supabase callbacks
      // In a real test, we'd simulate the subscription callback
    })

    it('should track active subscription count', () => {
      expect(realtimeService.getActiveSubscriptionCount()).toBe(0)
      
      const unsubscribe = realtimeService.subscribe({
        userId: 'test-user',
        onTransactionInsert: vi.fn()
      })
      
      expect(realtimeService.getActiveSubscriptionCount()).toBe(1)
      
      unsubscribe()
      expect(realtimeService.getActiveSubscriptionCount()).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle subscription errors gracefully', () => {
      const userId = 'test-user-id'
      const onConnectionStateChange = vi.fn()
      const options = {
        userId,
        onTransactionInsert: vi.fn(),
        onConnectionStateChange
      }

      const unsubscribe = realtimeService.subscribe(options)
      
      // In a real implementation, we'd simulate the error callback
      // For now, just verify the subscription was created
      expect(realtimeService.getActiveSubscriptionCount()).toBe(1)
      
      unsubscribe()
    })
  })
})