'use client';

import React from 'react';
import { ViewportLazy } from '@/components/ui/lazy-wrapper';
import { ChartSkeleton } from '@/components/ui/skeleton';
import { ExpenseChart, ExpenseChartProps } from './expense-chart';

export function LazyExpenseChart(props: ExpenseChartProps) {
  return (
    <ViewportLazy
      fallback={<ChartSkeleton className={props.className} />}
      threshold={0.1}
      rootMargin="100px"
    >
      <ExpenseChart {...props} />
    </ViewportLazy>
  );
}

export type { ExpenseChartProps };
export default LazyExpenseChart;