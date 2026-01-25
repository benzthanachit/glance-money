'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/utils/sw-registration'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register in production
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker()
    }
  }, [])

  return null // This component doesn't render anything
}

export default ServiceWorkerRegistration