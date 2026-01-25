'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrency } from '@/lib/contexts/currency-context'
import { useTranslations } from 'next-intl'
import { Currency } from '@/lib/utils/formatting'
import { DollarSign } from 'lucide-react'

export function CurrencySettings() {
  const t = useTranslations('settings')
  const tCurrency = useTranslations('currency')
  const { currency, setCurrency, availableCurrencies } = useCurrency()

  const currencyInfo = {
    THB: { symbol: '฿', name: tCurrency('thb') },
    USD: { symbol: '$', name: tCurrency('usd') },
    EUR: { symbol: '€', name: tCurrency('eur') }
  }

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency as Currency)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t('currency')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Currency</p>
              <p className="text-sm text-muted-foreground">
                {currencyInfo[currency].symbol} {currencyInfo[currency].name}
              </p>
            </div>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('currency')} />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((curr) => (
                  <SelectItem key={curr} value={curr}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {currencyInfo[curr].symbol}
                      </span>
                      <span>{currencyInfo[curr].name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({curr})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Currency preference affects how amounts are displayed throughout the app.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}