'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { offlineTransactionService } from '@/lib/services/offlineTransactionService'
import { syncService } from '@/lib/services/syncService'

interface OfflineIndicatorProps {
  className?: string
  showSyncButton?: boolean
}

export function OfflineIndicator({ className = '', showSyncButton = true }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [hasPendingOperations, setHasPendingOperations] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const checkPendingOperations = async () => {
    try {
      const pending = await offlineTransactionService.hasPendingOperations()
      setHasPendingOperations(pending)
    } catch (error) {
      console.error('Failed to check pending operations:', error)
    }
  }

  const getLastSyncTime = async () => {
    try {
      const lastSync = await syncService.getLastSyncTime()
      setLastSyncTime(lastSync)
    } catch (error) {
      console.error('Failed to get last sync time:', error)
    }
  }

  useEffect(() => {
    // Initialize online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check for pending operations
    checkPendingOperations()

    // Get last sync time
    getLastSyncTime()

    // Listen for sync completion
    const unsubscribe = syncService.onSyncComplete((result) => {
      setIsSyncing(false)
      setSyncStatus(result.success ? 'success' : 'error')
      checkPendingOperations()
      getLastSyncTime()
      
      // Reset status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000)
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
    }
  }, [checkPendingOperations, getLastSyncTime])

  const handleSync = async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    setSyncStatus('idle')

    try {
      await offlineTransactionService.syncOfflineData()
    } catch (error) {
      console.error('Sync failed:', error)
      setIsSyncing(false)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }

  const formatLastSyncTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getStatusIcon = () => {
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (syncStatus === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />
    if (syncStatus === 'error') return <AlertCircle className="h-4 w-4 text-red-500" />
    if (!isOnline) return <WifiOff className="h-4 w-4 text-red-500" />
    return <Wifi className="h-4 w-4 text-green-500" />
  }

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...'
    if (syncStatus === 'success') return 'Synced'
    if (syncStatus === 'error') return 'Sync failed'
    if (!isOnline) return 'Offline'
    return 'Online'
  }

  const getStatusVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (isSyncing) return 'secondary'
    if (syncStatus === 'success') return 'default'
    if (syncStatus === 'error' || !isOnline) return 'destructive'
    return 'default'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={getStatusVariant()} className="flex items-center gap-1">
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </Badge>

      {hasPendingOperations && (
        <Badge variant="outline" className="text-xs">
          Pending changes
        </Badge>
      )}

      {showSyncButton && isOnline && hasPendingOperations && !isSyncing && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Sync
        </Button>
      )}

      {lastSyncTime && (
        <span className="text-xs text-muted-foreground">
          Last sync: {formatLastSyncTime(lastSyncTime)}
        </span>
      )}
    </div>
  )
}

export default OfflineIndicator