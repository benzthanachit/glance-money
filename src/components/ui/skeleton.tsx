'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      {...props}
    />
  );
}

// Specialized skeleton components for different use cases
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ 
  items = 3, 
  className 
}: { 
  items?: number; 
  className?: string; 
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}