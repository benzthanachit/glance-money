'use client'

import { ResponsiveLayout } from '@/components/layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PWAStatus from '@/components/ui/pwa-status'
import { LanguageSettings } from '@/components/settings/language-settings'
import { CurrencySettings } from '@/components/settings/currency-settings'
import { ThemeSettings } from '@/components/settings/theme-settings'
import { DataManagement } from '@/components/settings/data-management'
import { useAuth } from '@/lib/auth/context'
import { useTranslations } from 'next-intl'
import { LogOut } from 'lucide-react'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const { signOut } = useAuth()

  return (
    <ProtectedRoute>
      <ResponsiveLayout currentPage="settings">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">Customize your app preferences</p>
      </div>

      <div className="space-y-6">
        <PWAStatus />
        
        <LanguageSettings />
        
        <CurrencySettings />
        
        <ThemeSettings />
        
        <DataManagement />
        
        {/* Sign Out Section - Visible on all devices */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={signOut}
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
    </ProtectedRoute>
  )
}