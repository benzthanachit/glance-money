'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CurrencyFormatter } from '@/components/ui/currency-formatter'
import { DateFormatter } from '@/components/ui/date-formatter'
import { GoalWithProgress } from '@/lib/types'
import { Currency } from '@/lib/utils/formatting'
import { cn } from '@/lib/utils'
import {
  Target,
  Calendar,
  TrendingUp,
  Pencil, // Changed from Edit
  Trash2,
  PlusCircle, // Added
  CheckCircle2
} from 'lucide-react'
import { GoalAllocationDialog } from './goal-allocation-dialog' // Added
import { useState } from 'react' // Added

interface GoalProgressCardProps {
  goal: GoalWithProgress
  currency: Currency
  locale: 'th' | 'en'
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onAllocateTransaction: (goalId: string) => void // Kept for prop compatibility, but we'll use internal dialog
  onGoalUpdated?: () => void // Added
}

export function GoalProgressCard({
  goal,
  currency,
  locale,
  onEdit,
  onDelete,
  onAllocateTransaction,
  onGoalUpdated,
  className // Added className back to props destructuring
}: GoalProgressCardProps & { className?: string }) { // Added className to type
  const [isAllocationOpen, setIsAllocationOpen] = useState(false) // Added

  const isCompleted = goal.progressPercentage >= 100
  const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !isCompleted

  const getProgressColor = () => {
    if (isCompleted) return 'bg-green-500'
    if (isOverdue) return 'bg-red-500'
    if (goal.progressPercentage >= 75) return 'bg-blue-500'
    if (goal.progressPercentage >= 50) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  const getStatusText = () => {
    if (isCompleted) {
      return locale === 'th' ? 'สำเร็จแล้ว' : 'Completed'
    }
    if (isOverdue) {
      return locale === 'th' ? 'เกินกำหนด' : 'Overdue'
    }
    return locale === 'th' ? 'กำลังดำเนินการ' : 'In Progress'
  }

  const getStatusColor = () => {
    if (isCompleted) return 'text-green-600 dark:text-green-400'
    if (isOverdue) return 'text-red-600 dark:text-red-400'
    return 'text-blue-600 dark:text-blue-400'
  }

  return (
    <Card
      className={cn(
        'w-full touch-manipulation transition-all duration-200 hover:shadow-md',
        isCompleted && 'ring-2 ring-green-500/20 bg-green-50/50 dark:bg-green-950/20',
        isOverdue && 'ring-2 ring-red-500/20 bg-red-50/50 dark:bg-red-950/20',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold truncate">
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : (
                <Target className="h-5 w-5 text-blue-600 flex-shrink-0" />
              )}
              <span className="truncate">{goal.name}</span>
            </CardTitle>
            <div className={cn('text-sm font-medium mt-1', getStatusColor())}>
              {getStatusText()}
            </div>
          </div>

          <CardAction>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(goal.id)}
                className="h-8 w-8"
                aria-label={locale === 'th' ? 'แก้ไขเป้าหมาย' : 'Edit goal'}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(goal.id)}
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                aria-label={locale === 'th' ? 'ลบเป้าหมาย' : 'Delete goal'}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {locale === 'th' ? 'ความคืบหน้า' : 'Progress'}
            </span>
            <span className="font-semibold">
              {Math.min(goal.progressPercentage, 100).toFixed(1)}%
            </span>
          </div>

          <Progress
            value={Math.min(goal.progressPercentage, 100)}
            className="h-3"
          />

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              <CurrencyFormatter
                amount={goal.currentAmount}
                currency={currency}
                locale={locale}
              />
            </div>
            <div className="font-semibold">
              <CurrencyFormatter
                amount={goal.targetAmount}
                currency={currency}
                locale={locale}
              />
            </div>
          </div>
        </div>

        {/* Remaining Amount */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {locale === 'th' ? 'ยังต้องการ' : 'Remaining'}
            </span>
          </div>
          <div className="text-sm font-semibold">
            <CurrencyFormatter
              amount={Math.max(goal.remainingAmount, 0)}
              currency={currency}
              locale={locale}
            />
          </div>
        </div>

        {/* Deadline */}
        {goal.deadline && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {locale === 'th' ? 'กำหนดเสร็จ:' : 'Deadline:'}
            </span>
            <DateFormatter
              date={new Date(goal.deadline)}
              locale={locale}
              className={cn(
                'font-medium',
                isOverdue && 'text-red-600 dark:text-red-400'
              )}
            />
          </div>
        )}

        {/* Allocate Transaction Button */}
        {!isCompleted && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAllocateTransaction(goal.id)}
            className="w-full mt-4"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {locale === 'th' ? 'จัดสรรเงิน' : 'Allocate Money'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}