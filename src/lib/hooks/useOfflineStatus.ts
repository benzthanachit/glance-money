'use client'

import { useState, useEffect } from 'react'
import { offlineTransactionService } from '@/lib/services/offlineTransactionService'
import { syncService } from '@/lib/services/syncService'

interface OfflineStatus {
  isOnline: boolean
  hasPendingOperations: boolean
  isSyncing: boolean
  lastSyncTime: Date | null
  syncError: string | null
}

interface SyncResult {
  success: boolean
  syncedTransactions: number
  syncedUpdates: number
  syncedDeletes: number
  errors: string[]
}

export function useOfflineStatus() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    hasPendingOperations: false,
    isSyncing: false,
    lastSyncTime: null,
    syncError: null
  })

  useEffect(() => {
    // Initialize status
    checkPendingOperations()
    getLastSyncTime()

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true, syncError: null }))
      // Auto-sync when coming back online
      autoSync()
    }

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for sync completion
    const unsubscribe = syncService.onSyncComplete((result: SyncResult) => {
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        syncError: result.success ? null : result.errors.join(', ')
      }))
      checkPendingOperations()
      getLastSyncTime()
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
    }
  }, [])

  const checkPendingOperations = async () => {
    try {
      const pending = await offlineTransactionService.hasPendingOperations()
      setStatus(prev => ({ ...prev, hasPendingOperations: pending }))
    } catch (error) {
      console.error('Failed to check pending operations:', error)
    }
  }

  const getLastSyncTime = async () => {
    try {
      const lastSync = await syncService.getLastSyncTime()
      setStatus(prev => ({ ...prev, lastSyncTime: lastSync }))
    } catch (error) {
      console.error('Failed to get last sync time:', error)
    }
  }

  const autoSync = async () => {
    try {
      const hasPending = await offlineTransactionService.hasPendingOperations()
      if (hasPending) {
        await manualSync()
      }
    } catch (error) {
      console.error('Auto-sync failed:', error)
    }
  }

  const manualSync = async (): Promise<SyncResult | null> => {
    if (!status.isOnline || status.isSyncing) {
      return null
    }

    setStatus(prev => ({ ...prev, isSyncing: true, syncError: null }))

    try {
      await offlineTransactionService.syncOfflineData()
      // Return a basic success result since syncOfflineData doesn't return the result
      return {
        success: true,
        syncedTransactions: 0,
        syncedUpdates: 0,
        syncedDeletes: 0,
        errors: []
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error'
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        syncError: errorMessage
      }))
      return null
    }
  }

  const clearSyncError = () => {
    setStatus(prev => ({ ...prev, syncError: null }))
  }

  return {
    ...status,
    manualSync,
    clearSyncError,
    refreshStatus: () => {
      checkPendingOperations()
      getLastSyncTime()
    }
  }
}

export default useOfflineStatus