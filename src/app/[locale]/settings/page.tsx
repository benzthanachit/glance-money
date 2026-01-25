'use client'

import { ResponsiveLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PWAStatus from '@/components/ui/pwa-status'
import { LanguageSettings } from '@/components/settings/language-settings'
import { CurrencySettings } from '@/components/settings/currency-settings'
import { ThemeSettings } from '@/components/settings/theme-settings'
import { DataManagement } from '@/components/settings/data-management'
import { useTranslations } from 'next-intl'

export default function SettingsPage() {
  const t = useTranslations('settings')

  return (
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
      </div>
    </ResponsiveLayout>
  )
}