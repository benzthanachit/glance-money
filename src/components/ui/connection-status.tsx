'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRealtimeConnectionState } from '@/lib/hooks/useRealtimeUpdates'
import { realtimeService } from '@/lib/services/realtimeService'
import { useAuth } from '@/lib/auth/context'
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConnectionStatusProps {
  className?: string
  showDetails?: boolean
  compact?: boolean
}

export function ConnectionStatus({ 
  className, 
  showDetails = false, 
  compact = false 
}: ConnectionStatusProps) {
  const { user } = useAuth()
  const connectionState = useRealtimeConnectionState()

  const handleReconnect = () => {
    if (user?.id) {
      realtimeService.reconnect(user.id, {
        userId: user.id,
        // Basic reconnection - specific callbacks would be set by the component using real-time updates
      })
    }
  }

  const getStatusIcon = () => {
    if (connectionState.isConnecting) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    if (connectionState.isConnected) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    
    if (connectionState.error) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
    
    return <WifiOff className="h-4 w-4 text-gray-500" />
  }

  const getStatusText = () => {
    if (connectionState.isConnecting) {
      return 'Connecting...'
    }
    
    if (connectionState.isConnected) {
      return 'Connected'
    }
    
    if (connectionState.error) {
      return 'Connection Error'
    }
    
    return 'Disconnected'
  }

  const getStatusColor = () => {
    if (connectionState.isConnecting) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    
    if (connectionState.isConnected) {
      return 'bg-green-100 text-green-800 border-green-200'
    }
    
    if (connectionState.error) {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {getStatusIcon()}
        {!connectionState.isConnected && connectionState.error && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReconnect}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>
        
        {!connectionState.isConnected && connectionState.error && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconnect}
            disabled={connectionState.isConnecting}
          >
            <RefreshCw className={cn(
              'h-4 w-4 mr-2',
              connectionState.isConnecting && 'animate-spin'
            )} />
            Reconnect
          </Button>
        )}
      </div>

      {showDetails && (
        <div className="text-xs text-muted-foreground space-y-1">
          {connectionState.lastConnected && (
            <div>
              Last connected: {connectionState.lastConnected.toLocaleTimeString()}
            </div>
          )}
          
          {connectionState.error && (
            <div className="text-red-600">
              Error: {connectionState.error}
            </div>
          )}
          
          {connectionState.reconnectAttempts > 0 && (
            <div>
              Reconnect attempts: {connectionState.reconnectAttempts}
            </div>
          )}
          
          <div>
            Active subscriptions: {realtimeService.getActiveSubscriptionCount()}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Simple connection indicator for the header/navigation
 */
export function ConnectionIndicator({ className }: { className?: string }) {
  const connectionState = useRealtimeConnectionState()
  
  return (
    <div className={cn('flex items-center', className)}>
      {connectionState.isConnected ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : connectionState.isConnecting ? (
        <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      <span className="sr-only">
        {connectionState.isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  )
}