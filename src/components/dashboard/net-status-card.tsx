'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyFormatter } from '@/components/ui/currency-formatter';
import { useTheme } from '@/lib/contexts/theme-context';
import { Currency } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NetStatusCardProps {
  netAmount: number;
  currency: Currency;
  locale: 'th' | 'en';
  theme: 'positive' | 'negative';
  totalIncome?: number;
  totalExpenses?: number;
  loading?: boolean;
  className?: string;
}

export type { NetStatusCardProps };

export function NetStatusCard({
  netAmount,
  currency,
  locale,
  theme,
  totalIncome = 0,
  totalExpenses = 0,
  loading = false,
  className
}: NetStatusCardProps) {
  const { setNetStatusTheme, isTransitioning } = useTheme();

  // Update theme when netAmount changes
  React.useEffect(() => {
    setNetStatusTheme(theme);
  }, [theme, setNetStatusTheme]);

  const getStatusIcon = () => {
    if (netAmount > 0) {
      return <TrendingUp className="h-6 w-6 text-green-600" />;
    } else if (netAmount < 0) {
      return <TrendingDown className="h-6 w-6 text-red-600" />;
    } else {
      return <Minus className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (locale === 'th') {
      if (netAmount > 0) return 'สถานะการเงินดี';
      if (netAmount < 0) return 'สถานะการเงินติดลบ';
      return 'สถานะการเงินสมดุล';
    } else {
      if (netAmount > 0) return 'Positive Financial Status';
      if (netAmount < 0) return 'Negative Financial Status';
      return 'Balanced Financial Status';
    }
  };

  const getThemeClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';
    
    if (theme === 'positive') {
      return cn(
        baseClasses,
        'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50',
        'dark:border-green-800 dark:from-green-950 dark:to-emerald-950',
        isTransitioning && 'scale-[1.02] shadow-lg'
      );
    } else {
      return cn(
        baseClasses,
        'border-red-200 bg-gradient-to-br from-red-50 to-rose-50',
        'dark:border-red-800 dark:from-red-950 dark:to-rose-950',
        isTransitioning && 'scale-[1.02] shadow-lg'
      );
    }
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {locale === 'th' ? 'สถานะการเงิน' : 'Net Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-12 bg-muted animate-pulse rounded-md" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-8 bg-muted animate-pulse rounded-md" />
              <div className="h-8 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', getThemeClasses(), className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {locale === 'th' ? 'สถานะการเงิน' : 'Net Status'}
          </CardTitle>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Net Status Amount */}
          <div className="space-y-1">
            <div className={cn(
              'text-3xl font-bold transition-colors duration-300',
              theme === 'positive' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            )}>
              <CurrencyFormatter
                amount={netAmount}
                currency={currency}
                locale={locale}
                showSign={true}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {getStatusText()}
            </p>
          </div>

          {/* Income and Expenses Breakdown */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {locale === 'th' ? 'รายได้' : 'Income'}
              </p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                <CurrencyFormatter
                  amount={totalIncome}
                  currency={currency}
                  locale={locale}
                />
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {locale === 'th' ? 'รายจ่าย' : 'Expenses'}
              </p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                <CurrencyFormatter
                  amount={totalExpenses}
                  currency={currency}
                  locale={locale}
                />
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default NetStatusCard;