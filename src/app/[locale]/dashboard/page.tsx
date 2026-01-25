'use client'

import { useAuth } from '@/lib/auth/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveLayout } from '@/components/layout'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function DashboardPage() {
  const { user } = useAuth()
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
        <Card>
          <CardHeader>
            <CardTitle>{t('netStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">฿0.00</p>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>

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

      {/* Demo section to show FAB functionality */}
      <div className="mt-8 text-center">
        <Card className="mx-auto max-w-md">
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
      </div>

      <div className="mt-8 text-center">
        <p className="text-muted-foreground">
          Dashboard functionality will be implemented in upcoming tasks.
        </p>
      </div>
    </ResponsiveLayout>
  )
}