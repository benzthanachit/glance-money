'use client'

import { useState, useEffect } from 'react'
import { Card } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Smartphone, Wifi, WifiOff, Download, CheckCircle } from 'lucide-react'

interface PWAStatusProps {
  className?: string
}

export function PWAStatus({ className }: PWAStatusProps) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'loading' | 'active' | 'error'>('loading')

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isIOSStandalone)
    }

    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Check service worker status
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration && registration.active) {
            setServiceWorkerStatus('active')
          } else {
            setServiceWorkerStatus('error')
          }
        } catch (error) {
          console.error('Error checking service worker:', error)
          setServiceWorkerStatus('error')
        }
      } else {
        setServiceWorkerStatus('error')
      }
    }

    checkInstalled()
    updateOnlineStatus()
    checkServiceWorker()

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setServiceWorkerStatus('active')
      })
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const handleManualInstall = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    let instructions = ''
    
    if (isIOS) {
      instructions = 'To install on iOS:\n\n1. Tap the Share button (□↗) in Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm\n\nThe app will appear on your home screen!'
    } else if (isAndroid) {
      instructions = 'To install on Android:\n\n1. Tap the menu button (⋮) in your browser\n2. Look for "Add to Home screen" or "Install app"\n3. Tap "Add" or "Install" to confirm\n\nThe app will appear on your home screen!'
    } else {
      instructions = 'To install this app:\n\n1. Look for an install icon (⬇) in your browser\'s address bar\n2. Or check your browser\'s menu for "Install" option\n3. Follow the prompts to install\n\nThe app will be available like a native app!'
    }
    
    alert(instructions)
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">PWA Status</h3>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Installation Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Installation</span>
            </div>
            {isInstalled ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Installed
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="outline">Not Installed</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualInstall}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Install
                </Button>
              </div>
            )}
          </div>

          {/* Online Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-gray-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-sm text-gray-700">Connection</span>
            </div>
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Service Worker Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                serviceWorkerStatus === 'active' ? 'bg-green-500' :
                serviceWorkerStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <span className="text-sm text-gray-700">Offline Support</span>
            </div>
            <Badge variant={
              serviceWorkerStatus === 'active' ? "default" :
              serviceWorkerStatus === 'error' ? "destructive" : "secondary"
            }>
              {serviceWorkerStatus === 'active' ? 'Active' :
               serviceWorkerStatus === 'error' ? 'Error' : 'Loading'}
            </Badge>
          </div>
        </div>

        {!isOnline && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              You're offline. Changes are being saved locally and will sync when you reconnect.
            </p>
          </div>
        )}

        {isInstalled && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-800">
              ✨ Great! You're using Glance Money as an installed app with full offline support.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

export default PWAStatus