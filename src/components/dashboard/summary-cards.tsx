'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyFormatter } from '@/components/ui/currency-formatter';
import { CategorySummary } from '@/lib/types';
import { Currency } from '@/lib/utils/formatting';
import { categoryService } from '@/lib/services/categoryService';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  PieChart,
  Utensils,
  Car,
  Home,
  TrendingUpIcon
} from 'lucide-react';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  categoryBreakdown: CategorySummary[];
  currency: Currency;
  locale: 'th' | 'en';
  loading?: boolean;
  className?: string;
}

const getCategoryIcon = (category: string) => {
  // First try to get from category service
  const serviceIcon = categoryService.getCategoryIcon(category);
  if (serviceIcon !== '📝') {
    return <span className="text-lg">{serviceIcon}</span>;
  }
  
  // Fallback to Lucide icons for better visual consistency
  const iconMap: Record<string, React.ReactNode> = {
    'Food': <Utensils className="h-5 w-5" />,
    'Transport': <Car className="h-5 w-5" />,
    'Fixed Cost': <Home className="h-5 w-5" />,
    'DCA': <TrendingUpIcon className="h-5 w-5" />,
  };
  
  return iconMap[category] || <PieChart className="h-5 w-5" />;
};

const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    'Food': 'text-orange-600 dark:text-orange-400',
    'Transport': 'text-blue-600 dark:text-blue-400',
    'Fixed Cost': 'text-purple-600 dark:text-purple-400',
    'DCA': 'text-green-600 dark:text-green-400',
  };
  
  return colorMap[category] || 'text-gray-600 dark:text-gray-400';
};

export function SummaryCards({
  totalIncome,
  totalExpenses,
  categoryBreakdown,
  currency,
  locale,
  loading = false,
  className
}: SummaryCardsProps) {
  if (loading) {
    return (
      <div className={cn('grid gap-4 md:gap-6', className)}>
        {/* Loading skeleton for mobile-first layout */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-3">
                <div className="h-5 bg-muted animate-pulse rounded-md" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-8 bg-muted animate-pulse rounded-md" />
                  <div className="h-4 bg-muted animate-pulse rounded-md w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Category breakdown loading */}
        <Card className="w-full">
          <CardHeader>
            <div className="h-6 bg-muted animate-pulse rounded-md w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 bg-muted animate-pulse rounded-full" />
                    <div className="h-4 bg-muted animate-pulse rounded-md w-20" />
                  </div>
                  <div className="h-4 bg-muted animate-pulse rounded-md w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 md:gap-6', className)}>
      {/* Summary Overview Cards - Mobile: stacked, Desktop: grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Income Card */}
        <Card className="w-full touch-manipulation">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>{locale === 'th' ? 'รายได้รวม' : 'Total Income'}</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                <CurrencyFormatter
                  amount={totalIncome}
                  currency={currency}
                  locale={locale}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {locale === 'th' ? 'เดือนนี้' : 'This month'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="w-full touch-manipulation">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>{locale === 'th' ? 'รายจ่ายรวม' : 'Total Expenses'}</span>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                <CurrencyFormatter
                  amount={totalExpenses}
                  currency={currency}
                  locale={locale}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {locale === 'th' ? 'เดือนนี้' : 'This month'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Goals Summary Card */}
        <Card className="w-full touch-manipulation md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>{locale === 'th' ? 'เป้าหมาย' : 'Goals'}</span>
              <Target className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                0
              </div>
              <p className="text-xs text-muted-foreground">
                {locale === 'th' ? 'ยังไม่มีเป้าหมาย' : 'No goals set'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Card - Full width on mobile, part of grid on desktop */}
      <Card className="w-full touch-manipulation">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {locale === 'th' ? 'รายจ่ายตามหมวดหมู่' : 'Expenses by Category'}
            </span>
            <PieChart className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryBreakdown.length > 0 ? (
            <div className="space-y-4">
              {/* Mobile: Vertical list, Desktop: Can be grid if needed */}
              <div className="grid gap-3 md:gap-4">
                {categoryBreakdown.map((category) => (
                  <div
                    key={category.category}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors touch-manipulation"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn('flex-shrink-0', getCategoryColor(category.category))}>
                        {getCategoryIcon(category.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {category.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {category.transactionCount} {locale === 'th' ? 'รายการ' : 'transactions'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        <CurrencyFormatter
                          amount={category.amount}
                          currency={currency}
                          locale={locale}
                        />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simple progress bars for visual representation */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                {categoryBreakdown.map((category) => (
                  <div key={`${category.category}-bar`} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{category.category}</span>
                      <span className="text-muted-foreground">{category.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all duration-300',
                          getCategoryColor(category.category).replace('text-', 'bg-')
                        )}
                        style={{ width: `${Math.min(category.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {locale === 'th' ? 'ยังไม่มีรายจ่าย' : 'No expenses yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === 'th' ? 'เริ่มเพิ่มรายการเพื่อดูสรุป' : 'Start adding transactions to see breakdown'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export type { SummaryCardsProps };
export default SummaryCards;