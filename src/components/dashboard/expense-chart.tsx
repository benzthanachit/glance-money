'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySummary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

interface ExpenseChartProps {
  categoryBreakdown: CategorySummary[];
  totalExpenses: number;
  locale: 'th' | 'en';
  loading?: boolean;
  className?: string;
}

const getCategoryColor = (category: string, opacity: number = 1) => {
  const colorMap: Record<string, string> = {
    'Food': `rgba(234, 88, 12, ${opacity})`, // orange-600
    'Transport': `rgba(37, 99, 235, ${opacity})`, // blue-600
    'Fixed Cost': `rgba(147, 51, 234, ${opacity})`, // purple-600
    'DCA': `rgba(34, 197, 94, ${opacity})`, // green-600
  };
  
  return colorMap[category] || `rgba(107, 114, 128, ${opacity})`; // gray-500
};

export function ExpenseChart({
  categoryBreakdown,
  totalExpenses,
  locale,
  loading = false,
  className
}: ExpenseChartProps) {
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded-md w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
            <div className="flex justify-center space-x-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-muted animate-pulse rounded-full" />
                  <div className="h-4 bg-muted animate-pulse rounded-md w-16" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (categoryBreakdown.length === 0 || totalExpenses === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{locale === 'th' ? 'แผนภูมิรายจ่าย' : 'Expense Chart'}</span>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <PieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {locale === 'th' ? 'ยังไม่มีข้อมูลรายจ่าย' : 'No expense data available'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'th' ? 'เพิ่มรายการเพื่อดูแผนภูมิ' : 'Add transactions to see chart'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Simple donut chart using CSS and SVG
  const radius = 80;
  const strokeWidth = 20;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  let cumulativePercentage = 0;

  return (
    <Card className={cn('w-full touch-manipulation', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{locale === 'th' ? 'แผนภูมิรายจ่าย' : 'Expense Chart'}</span>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Simple Donut Chart */}
          <div className="flex justify-center">
            <div className="relative">
              <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90"
              >
                {/* Background circle */}
                <circle
                  stroke="currentColor"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  className="text-muted/20"
                />
                
                {/* Category segments */}
                {categoryBreakdown.map((category, index) => {
                  const strokeDasharray = `${(category.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -cumulativePercentage * circumference / 100;
                  cumulativePercentage += category.percentage;
                  
                  return (
                    <circle
                      key={category.category}
                      stroke={getCategoryColor(category.category)}
                      fill="transparent"
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      r={normalizedRadius}
                      cx={radius}
                      cy={radius}
                      className="transition-all duration-300 hover:opacity-80"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground">
                    {locale === 'th' ? 'รวม' : 'Total'}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {categoryBreakdown.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {locale === 'th' ? 'หมวดหมู่' : 'categories'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend - Responsive grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categoryBreakdown.map((category) => (
              <div
                key={category.category}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(category.category) }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">
                    {category.category}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {category.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bar chart alternative for mobile */}
          <div className="md:hidden space-y-3">
            <div className="text-sm font-medium text-foreground border-t pt-4">
              {locale === 'th' ? 'รายละเอียด' : 'Details'}
            </div>
            {categoryBreakdown.map((category) => (
              <div key={`bar-${category.category}`} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">{category.category}</span>
                  <span className="text-muted-foreground">{category.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(category.percentage, 100)}%`,
                      backgroundColor: getCategoryColor(category.category)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type { ExpenseChartProps };
export default ExpenseChart;