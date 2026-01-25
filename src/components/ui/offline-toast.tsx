'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useOfflineStatus } from '@/lib/hooks/useOfflineStatus'

export function OfflineToast() {
  const { isOnline, hasPendingOperations, isSyncing, syncError } = useOfflineStatus()

  useEffect(() => {
    if (!isOnline) {
      toast.info('You are offline', {
        description: 'Changes will be saved locally and synced when you reconnect.',
        icon: <WifiOff className="h-4 w-4" />,
        duration: 5000
      })
    } else {
      toast.success('You are back online', {
        description: hasPendingOperations ? 'Syncing your changes...' : 'All data is up to date.',
        icon: <Wifi className="h-4 w-4" />,
        duration: 3000
      })
    }
  }, [isOnline])

  useEffect(() => {
    if (isSyncing) {
      toast.loading('Syncing your changes...', {
        id: 'sync-progress',
        icon: <RefreshCw className="h-4 w-4 animate-spin" />
      })
    } else {
      toast.dismiss('sync-progress')
    }
  }, [isSyncing])

  useEffect(() => {
    if (syncError) {
      toast.error('Sync failed', {
        description: syncError,
        icon: <AlertCircle className="h-4 w-4" />,
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => {
            // This would trigger a manual sync
            window.location.reload()
          }
        }
      })
    }
  }, [syncError])

  // Show success when sync completes without errors
  useEffect(() => {
    if (!isSyncing && !syncError && hasPendingOperations === false && isOnline) {
      const timer = setTimeout(() => {
        toast.success('All changes synced', {
          description: 'Your data is up to date across all devices.',
          icon: <CheckCircle className="h-4 w-4" />,
          duration: 3000
        })
      }, 500) // Small delay to avoid showing immediately after sync starts

      return () => clearTimeout(timer)
    }
  }, [isSyncing, syncError, hasPendingOperations, isOnline])

  return null // This component only manages toasts
}

export default OfflineToast