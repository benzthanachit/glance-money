'use client'

import { useAuth } from '@/lib/auth/context'
import { NetStatusCard, SummaryCards, ExpenseChart } from '@/components/dashboard'
import { ResponsiveLayout } from '@/components/layout'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useNetStatusTheme } from '@/lib/hooks/useNetStatusTheme'
import { useFinancialSummary } from '@/lib/hooks/useFinancialSummary'
import { useLanguage } from '@/lib/contexts/language-context'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { locale } = useLanguage()
  const { netStatus, totalIncome, totalExpenses, theme, loading, isTransitioning } = useNetStatusTheme()
  const { categoryBreakdown, loading: summaryLoading } = useFinancialSummary()
  const t = useTranslations('dashboard')
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
      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="text-sm md:text-base text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <div className="w-full md:w-48">
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Mobile-First Responsive Dashboard Layout */}
      <div className="space-y-6 md:space-y-8">
        {/* Net Status Card - Full width on mobile, prominent on desktop */}
        <div className="w-full">
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

        {/* Desktop Grid Layout - Side by side positioning */}
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Summary Cards - Full width on mobile, 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <SummaryCards
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              categoryBreakdown={categoryBreakdown}
              currency="THB"
              locale={locale}
              loading={summaryLoading}
            />
          </div>

          {/* Chart Component - Full width on mobile, 1/3 width on desktop */}
          <div className="lg:col-span-1">
            <ExpenseChart
              categoryBreakdown={categoryBreakdown}
              totalExpenses={totalExpenses}
              locale={locale}
              loading={summaryLoading}
            />
          </div>
        </div>

        {/* Demo section - Touch-friendly on mobile */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          <div className="p-4 md:p-6 rounded-lg bg-muted/50 touch-manipulation">
            <h3 className="text-lg font-semibold mb-2">FAB Demo</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Click the floating action button (+ icon) to test functionality.
            </p>
            <p className="text-xl font-bold">
              FAB clicked: {fabClickCount} times
            </p>
          </div>

          <div className="p-4 md:p-6 rounded-lg bg-muted/50 touch-manipulation">
            <h3 className="text-lg font-semibold mb-2">Theme Demo</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Current theme: <span className="font-semibold capitalize">{theme}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {isTransitioning ? 'Theme is transitioning...' : 'Theme is stable'}
            </p>
            <div className="mt-3 text-xs text-muted-foreground">
              Theme changes automatically based on Net Status:
              <br />• Positive = Green theme
              <br />• Negative = Red theme
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  )
}