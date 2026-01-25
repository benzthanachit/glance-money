'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredLocale } from '@/lib/utils/preferences'
import { defaultLocale } from '@/i18n/config'

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to locale-specific settings page
    const locale = getStoredLocale() || defaultLocale
    router.replace(`/${locale}/settings`)
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to settings...</p>
      </div>
    </div>
  )
}