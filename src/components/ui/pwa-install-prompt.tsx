'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Card } from './card'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      // Check if running in iOS standalone mode
      const isIOSStandalone = (window.navigator as any).standalone === true
      
      setIsInstalled(isStandalone || isIOSStandalone)
    }

    checkInstalled()

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired')
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Save the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Don't show prompt if already installed
      if (!isInstalled) {
        setShowPrompt(true)
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App was installed')
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support the install prompt
      showManualInstallInstructions()
      return
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`PWA: User response to install prompt: ${outcome}`)
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt')
      } else {
        console.log('PWA: User dismissed the install prompt')
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('PWA: Error showing install prompt:', error)
      showManualInstallInstructions()
    }
  }

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    let instructions = ''
    
    if (isIOS) {
      instructions = 'To install this app on iOS:\n1. Tap the Share button\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm'
    } else if (isAndroid) {
      instructions = 'To install this app on Android:\n1. Tap the menu button (⋮)\n2. Tap "Add to Home screen" or "Install app"\n3. Tap "Add" to confirm'
    } else {
      instructions = 'To install this app:\n1. Look for an install icon in your browser\'s address bar\n2. Or check your browser\'s menu for "Install" or "Add to Home Screen" option'
    }
    
    alert(instructions)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Remember that user dismissed the prompt (you could use localStorage here)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Don't show if already installed or if user recently dismissed
  if (isInstalled || !showPrompt) {
    return null
  }

  // Check if user recently dismissed (within 7 days)
  const dismissedTime = localStorage.getItem('pwa-install-dismissed')
  if (dismissedTime) {
    const now = new Date().getTime()
    const daysSinceDismissed = (now - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
    if (daysSinceDismissed < 7) {
      return null
    }
  }

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 p-4 shadow-lg border-2 border-green-200 bg-white md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-green-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Install Glance Money
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Add to your home screen for quick access and offline use
          </p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="flex items-center gap-1 text-xs"
            >
              <Download className="w-3 h-3" />
              Install
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="text-xs"
            >
              Later
            </Button>
          </div>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 h-auto"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}

export default PWAInstallPrompt