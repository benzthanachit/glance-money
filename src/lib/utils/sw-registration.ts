// Service Worker registration utility
export const registerServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('Service Worker registered successfully:', registration)

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, notify user
            console.log('New content available, please refresh')
            
            // Show a more user-friendly update notification
            const shouldUpdate = window.confirm(
              'A new version of Glance Money is available. Would you like to update now?'
            )
            
            if (shouldUpdate) {
              // Tell the new service worker to skip waiting
              newWorker.postMessage({ type: 'SKIP_WAITING' })
              window.location.reload()
            }
          }
        })
      }
    })

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Message from service worker:', event.data)
      
      if (event.data.type === 'SYNC_OFFLINE_DATA') {
        // Trigger offline data sync
        console.log('Service worker requesting offline data sync')
        // Dispatch a custom event that the sync service can listen to
        window.dispatchEvent(new CustomEvent('sw-sync-request', {
          detail: { timestamp: event.data.timestamp }
        }))
      }
    })

    // Handle service worker controller change (new version activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service worker controller changed - new version active')
      // Optionally reload the page to use the new service worker
      if (window.confirm('App updated! Reload to use the latest version?')) {
        window.location.reload()
      }
    })

  } catch (error) {
    console.error('Service Worker registration failed:', error)
  }
}

export const unregisterServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.unregister()
      console.log('Service Worker unregistered')
    }
  } catch (error) {
    console.error('Service Worker unregistration failed:', error)
  }
}

// Check if app is running as PWA
export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  // Check if running in iOS standalone mode
  const isIOSStandalone = (window.navigator as any).standalone === true
  
  return isStandalone || isIOSStandalone
}

// Get PWA installation status
export const getPWAStatus = () => {
  if (typeof window === 'undefined') {
    return {
      isInstalled: false,
      isInstallable: false,
      isOnline: true
    }
  }

  return {
    isInstalled: isPWA(),
    isInstallable: 'BeforeInstallPromptEvent' in window,
    isOnline: navigator.onLine
  }
}