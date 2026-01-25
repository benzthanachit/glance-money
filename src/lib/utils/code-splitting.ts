'use client';

import { ComponentType, lazy } from 'react';

// Utility for creating lazy-loaded components with error boundaries
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = lazy(importFn);
  
  return LazyComponent;
}

// Preload function for critical components
export function preloadComponent(importFn: () => Promise<any>) {
  // Start loading the component
  const componentPromise = importFn();
  
  // Return a function to get the loaded component
  return () => componentPromise;
}

// Route-based code splitting utilities
export const RouteComponents = {
  // Dashboard components
  ExpenseChart: () => import('@/components/dashboard/expense-chart'),
  SummaryCards: () => import('@/components/dashboard/summary-cards'),
  
  // Transaction components
  TransactionForm: () => import('@/components/transactions/transaction-form'),
  TransactionList: () => import('@/components/transactions/transaction-list'),
  RecurringTransactionManager: () => import('@/components/transactions/recurring-transaction-manager'),
  
  // Goals components
  GoalsOverview: () => import('@/components/goals/goals-overview'),
  GoalForm: () => import('@/components/goals/goal-form'),
  
  // Settings components (when implemented)
  SettingsPage: () => import('@/app/[locale]/settings/page'),
} as const;

// Preload critical components on app start
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload components that are likely to be needed soon
    setTimeout(() => {
      RouteComponents.TransactionForm();
      RouteComponents.TransactionList();
    }, 1000);
  }
}

// Bundle splitting configuration
export const BundleConfig = {
  // Critical components (loaded immediately)
  critical: [
    'NetStatusCard',
    'ResponsiveLayout',
    'BottomNavigation',
    'FloatingActionButton'
  ],
  
  // Important components (loaded on interaction or viewport)
  important: [
    'SummaryCards',
    'TransactionForm',
    'TransactionList'
  ],
  
  // Optional components (loaded on demand)
  optional: [
    'ExpenseChart',
    'GoalsOverview',
    'RecurringTransactionManager'
  ]
} as const;

// Dynamic import with retry logic
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  throw new Error('Dynamic import failed after retries');
}

// Check if component should be lazy loaded based on viewport
export function shouldLazyLoad(componentName: string, viewport: 'mobile' | 'desktop') {
  const { critical, important, optional } = BundleConfig;
  
  // Always load critical components
  if (critical.includes(componentName as any)) {
    return false;
  }
  
  // Load important components immediately on desktop, lazy on mobile
  if (important.includes(componentName as any)) {
    return viewport === 'mobile';
  }
  
  // Always lazy load optional components
  return true;
}