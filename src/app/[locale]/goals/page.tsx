'use client'

import { ResponsiveLayout } from '@/components/layout'
import { GoalsOverview } from '@/components/goals'
import { useLanguage } from '@/lib/contexts/language-context'
import { useCurrency } from '@/lib/contexts/currency-context'

export default function GoalsPage() {
  const { locale } = useLanguage()
  const { currency } = useCurrency()

  return (
    <ResponsiveLayout currentPage="goals">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {locale === 'th' ? 'เป้าหมาย' : 'Goals'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'th' ? 'ติดตามเป้าหมายทางการเงินของคุณ' : 'Track your financial goals'}
        </p>
      </div>

      <GoalsOverview
        currency={currency}
        locale={locale}
      />
    </ResponsiveLayout>
  )
}