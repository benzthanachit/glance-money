'use client'

import { useAuth } from '@/lib/auth/context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { NetStatusCard, LazySummaryCards, LazyExpenseChart } from '@/components/dashboard'
import { ResponsiveLayout } from '@/components/layout'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { ConnectionIndicator } from '@/components/ui/connection-status'
import { OfflineIndicator } from '@/components/ui/offline-indicator'
import { useNetStatusTheme } from '@/lib/hooks/useNetStatusTheme'
import { useFinancialSummary } from '@/lib/hooks/useFinancialSummary'
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates'
import { useLanguage } from '@/lib/contexts/language-context'
import { useResponsive } from '@/lib/hooks/useResponsive'
import { usePerformanceMonitor, useWebVitals } from '@/lib/hooks/usePerformanceMonitor'
import { preloadCriticalComponents } from '@/lib/utils/code-splitting'
import { categoryService } from '@/lib/services/categoryService'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { locale } = useLanguage()
  const { isMobile } = useResponsive()
  const { netStatus, totalIncome, totalExpenses, theme, loading, isTransitioning } = useNetStatusTheme()
  const { categoryBreakdown, loading: summaryLoading } = useFinancialSummary()
  const { isConnected, error: realtimeError } = useRealtimeUpdates({ 
    userId: user?.id,
    enableOptimisticUpdates: true 
  })
  const t = useTranslations('dashboard')
  const [fabClickCount, setFabClickCount] = useState(0)

  // Performance monitoring
  const { measureInteraction } = usePerformanceMonitor('DashboardPage')
  const webVitals = useWebVitals()

  // Preload critical components
  useEffect(() => {
    preloadCriticalComponents()
  }, [])

  // Load categories on mount to populate categoryService cache
  useEffect(() => {
    const loadCategories = async () => {
      try {
        await categoryService.getCategories()
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    
    if (user) {
      loadCategories()
    }
  }, [user])

  // Log real-time connection status for debugging
  useEffect(() => {
    console.log('Real-time connection status:', { isConnected, realtimeError })
  }, [isConnected, realtimeError])

  // Log Web Vitals in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && Object.keys(webVitals).length > 0) {
      console.log('Web Vitals:', webVitals)
    }
  }, [webVitals])

  const handleAddTransaction = () => {
    const endMeasurement = measureInteraction('FAB Click')
    setFabClickCount(prev => prev + 1)
    // In a real implementation, this would open a transaction form modal or navigate to a form page
    console.log('FAB clicked - would open transaction form')
    endMeasurement()
  }

  return (
    <ProtectedRoute>
      <ResponsiveLayout 
        currentPage="home" 
        onAddTransaction={handleAddTransaction}
      >
      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('title')}</h1>
              <ConnectionIndicator />
            </div>
            <p className="text-sm md:text-base text-muted-foreground">Welcome back, {user?.email}</p>
            {realtimeError && (
              <p className="text-xs text-red-600 mt-1">
                Real-time updates unavailable: {realtimeError}
              </p>
            )}
            {/* Mobile offline indicator */}
            <div className="mt-2 md:hidden">
              <OfflineIndicator />
            </div>
          </div>
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-4">
            {/* Desktop offline indicator */}
            <div className="hidden md:block">
              <OfflineIndicator />
            </div>
            <div className="w-full md:w-48">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-First Responsive Dashboard Layout */}
      <div className="space-y-6 md:space-y-8">
        {/* Net Status Card - Critical component, always loaded immediately */}
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

        {/* Desktop Grid Layout - Side by side positioning with lazy loading */}
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Summary Cards - Lazy loaded for better performance */}
          <div className="lg:col-span-2">
            <LazySummaryCards
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              categoryBreakdown={categoryBreakdown}
              currency="THB"
              locale={locale}
              loading={summaryLoading}
            />
          </div>

          {/* Chart Component - Lazy loaded as it's non-critical */}
          <div className="lg:col-span-1">
            <LazyExpenseChart
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
            <h3 className="text-lg font-semibold mb-2">Real-time Status</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Connection: <span className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {isTransitioning ? 'Theme is transitioning...' : 'Theme is stable'}
            </p>
            <div className="mt-3 text-xs text-muted-foreground">
              Real-time updates are {isConnected ? 'active' : 'inactive'}
              <br />• Transaction changes sync automatically
              <br />• Financial calculations update in real-time
              {process.env.NODE_ENV === 'development' && (
                <>
                  <br />• Viewport: {isMobile ? 'Mobile' : 'Desktop'}
                  <br />• Lazy loading: {isMobile ? 'Enabled' : 'Selective'}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
    </ProtectedRoute>
  )
}