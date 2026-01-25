'use client';

import React from 'react';
import { ViewportLazy } from '@/components/ui/lazy-wrapper';
import { CardSkeleton, ListSkeleton } from '@/components/ui/skeleton';
import { SummaryCards, SummaryCardsProps } from './summary-cards';
import { cn } from '@/lib/utils';

function SummaryCardsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-4 md:gap-6', className)}>
      {/* Summary Overview Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      
      {/* Category Breakdown Skeleton */}
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-muted animate-pulse rounded-md w-1/3" />
            <div className="h-5 w-5 bg-muted animate-pulse rounded-full" />
          </div>
          <ListSkeleton items={4} />
        </div>
      </div>
    </div>
  );
}

export function LazySummaryCards(props: SummaryCardsProps) {
  return (
    <ViewportLazy
      fallback={<SummaryCardsSkeleton className={props.className} />}
      threshold={0.1}
      rootMargin="50px"
    >
      <SummaryCards {...props} />
    </ViewportLazy>
  );
}

export type { SummaryCardsProps };
export default LazySummaryCards;