'use client'

import { useAuth } from '@/lib/auth/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NetStatusCard } from '@/components/dashboard'
import { ResponsiveLayout } from '@/components/layout'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useNetStatusTheme } from '@/lib/hooks/useNetStatusTheme'
import { useLanguage } from '@/lib/contexts/language-context'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { locale } = useLanguage()
  const { netStatus, totalIncome, totalExpenses, theme, loading, isTransitioning } = useNetStatusTheme()
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const tNav = useTranslations('navigation')
  const [fabClickCount, setFabClickCount] = useState(0)

  const handleAddTransaction = () => {
    setFabClickCount(prev => prev + 1)
    // In a real implementation, this would open a transaction form modal or navigate to a form page
    console.log('FAB clicked - would open transaction form')
  }

  return (
    <ResponsiveLayout 
      currentPage="home" 
      onAddTransaction={handleAddTransaction}
    >
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <div className="w-48">
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Replace the old Net Status card with the new NetStatusCard */}
        <div className="md:col-span-2 lg:col-span-3">
          <NetStatusCard
            netAmount={netStatus}
            currency="THB"
            locale={locale}
            theme={theme}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            loading={loading}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{tNav('transactions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tNav('goals')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">No goals set</p>
          </CardContent>
        </Card>
      </div>

      {/* Demo section to show FAB functionality and theme switching */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="mx-auto max-w-md md:max-w-none">
          <CardHeader>
            <CardTitle>FAB Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">
              Click the floating action button (+ icon) to test functionality.
            </p>
            <p className="text-lg font-semibold">
              FAB clicked: {fabClickCount} times
            </p>
          </CardContent>
        </Card>

        <Card className="mx-auto max-w-md md:max-w-none">
          <CardHeader>
            <CardTitle>Theme Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">
              Current theme: <span className="font-semibold capitalize">{theme}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {isTransitioning ? 'Theme is transitioning...' : 'Theme is stable'}
            </p>
            <div className="mt-3 text-xs text-muted-foreground">
              Theme changes automatically based on Net Status:
              <br />• Positive = Green theme
              <br />• Negative = Red theme
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-muted-foreground">
          Dashboard functionality will be implemented in upcoming tasks.
        </p>
      </div>
    </ResponsiveLayout>
  )
}