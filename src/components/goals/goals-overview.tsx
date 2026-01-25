'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GoalProgressCard } from './goal-progress-card'
import { GoalForm } from './goal-form'
import { GoalWithProgress, GoalSummary } from '@/lib/types'
import { CreateGoalData, UpdateGoalData, goalService } from '@/lib/services/goalService'
import { Currency } from '@/lib/utils/formatting'
import { useResponsive } from '@/lib/hooks/useResponsive'
import { cn } from '@/lib/utils'
import { 
  Plus, 
  Target, 
  TrendingUp, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react'

interface GoalsOverviewProps {
  currency: Currency
  locale: 'th' | 'en'
  className?: string
}

export function GoalsOverview({
  currency,
  locale,
  className
}: GoalsOverviewProps) {
  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [goalSummary, setGoalSummary] = useState<GoalSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | undefined>()
  
  // Mobile swipe state
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { isMobile } = useResponsive()

  // Load goals and summary
  const loadGoals = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [goalsData, summaryData] = await Promise.all([
        goalService.getGoals(),
        goalService.getGoalSummary()
      ])
      
      setGoals(goalsData)
      setGoalSummary(summaryData)
    } catch (err) {
      console.error('Error loading goals:', err)
      setError(err instanceof Error ? err.message : 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGoals()
  }, [])

  // Handle goal creation
  const handleCreateGoal = async (data: CreateGoalData) => {
    try {
      await goalService.createGoal(data)
      await loadGoals() // Refresh data
    } catch (err) {
      console.error('Error creating goal:', err)
      throw err
    }
  }

  // Handle goal editing
  const handleEditGoal = async (data: CreateGoalData) => {
    if (!editingGoal) return
    
    try {
      // Convert CreateGoalData to UpdateGoalData format
      const updateData: UpdateGoalData = {
        name: data.name,
        targetAmount: data.targetAmount,
        deadline: data.deadline || null,
      }
      await goalService.updateGoal(editingGoal.id, updateData)
      await loadGoals() // Refresh data
    } catch (err) {
      console.error('Error updating goal:', err)
      throw err
    }
  }

  // Handle goal deletion
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm(locale === 'th' ? 'คุณแน่ใจหรือไม่ที่จะลบเป้าหมายนี้?' : 'Are you sure you want to delete this goal?')) {
      return
    }
    
    try {
      await goalService.deleteGoal(goalId)
      await loadGoals() // Refresh data
    } catch (err) {
      console.error('Error deleting goal:', err)
      // Could show error toast here
    }
  }

  // Handle transaction allocation (placeholder)
  const handleAllocateTransaction = (goalId: string) => {
    // This would typically open a transaction allocation dialog
    console.log('Allocate transaction to goal:', goalId)
    // TODO: Implement transaction allocation UI
  }

  // Mobile swipe navigation
  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const cardWidth = container.scrollWidth / goals.length
    container.scrollTo({
      left: cardWidth * index,
      behavior: 'smooth'
    })
    setCurrentIndex(index)
  }

  const handlePrevious = () => {
    const newIndex = Math.max(0, currentIndex - 1)
    scrollToIndex(newIndex)
  }

  const handleNext = () => {
    const newIndex = Math.min(goals.length - 1, currentIndex + 1)
    scrollToIndex(newIndex)
  }

  // Open create form
  const openCreateForm = () => {
    setFormMode('create')
    setEditingGoal(undefined)
    setIsFormOpen(true)
  }

  // Open edit form
  const openEditForm = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (goal) {
      setFormMode('edit')
      setEditingGoal(goal)
      setIsFormOpen(true)
    }
  }

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Summary cards loading */}
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-5 bg-muted animate-pulse rounded-md" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Goals loading */}
        <div className="space-y-4">
          <div className="h-6 bg-muted animate-pulse rounded-md w-1/3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-64">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-muted animate-pulse rounded-md" />
                    <div className="h-4 bg-muted animate-pulse rounded-md" />
                    <div className="h-2 bg-muted animate-pulse rounded-full" />
                    <div className="h-4 bg-muted animate-pulse rounded-md w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                {locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Error'}
              </p>
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadGoals}
              className="ml-auto"
            >
              {locale === 'th' ? 'ลองใหม่' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Goals Summary Cards */}
      {goalSummary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="touch-manipulation">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target className="h-4 w-4" />
                {locale === 'th' ? 'เป้าหมายทั้งหมด' : 'Total Goals'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {goalSummary.totalGoals}
              </div>
            </CardContent>
          </Card>

          <Card className="touch-manipulation">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                {locale === 'th' ? 'ความคืบหน้าเฉลี่ย' : 'Average Progress'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {goalSummary.averageProgress.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card className="touch-manipulation">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {locale === 'th' ? 'สำเร็จแล้ว' : 'Completed'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {goalSummary.goalsCompleted}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {locale === 'th' ? 'เป้าหมายของคุณ' : 'Your Goals'}
        </h2>
        <Button onClick={openCreateForm} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {locale === 'th' ? 'เพิ่มเป้าหมาย' : 'Add Goal'}
        </Button>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {locale === 'th' ? 'ยังไม่มีเป้าหมาย' : 'No Goals Yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {locale === 'th' 
                ? 'เริ่มสร้างเป้าหมายทางการเงินของคุณ' 
                : 'Start creating your financial goals'
              }
            </p>
            <Button onClick={openCreateForm}>
              <Plus className="h-4 w-4 mr-2" />
              {locale === 'th' ? 'สร้างเป้าหมายแรก' : 'Create First Goal'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Swipeable Cards */}
          {isMobile ? (
            <div className="relative">
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {goals.map((goal) => (
                  <div key={goal.id} className="flex-none w-80 snap-center">
                    <GoalProgressCard
                      goal={goal}
                      currency={currency}
                      locale={locale}
                      onEdit={openEditForm}
                      onDelete={handleDeleteGoal}
                      onAllocateTransaction={handleAllocateTransaction}
                    />
                  </div>
                ))}
              </div>

              {/* Navigation Dots */}
              {goals.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {goals.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToIndex(index)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        index === currentIndex
                          ? 'bg-primary w-6'
                          : 'bg-muted-foreground/30'
                      )}
                      aria-label={`Go to goal ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Navigation Arrows */}
              {goals.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                    onClick={handleNext}
                    disabled={currentIndex === goals.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ) : (
            /* Desktop: Grid Layout */
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  currency={currency}
                  locale={locale}
                  onEdit={openEditForm}
                  onDelete={handleDeleteGoal}
                  onAllocateTransaction={handleAllocateTransaction}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Goal Form Dialog */}
      <GoalForm
        mode={formMode}
        goal={editingGoal}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={formMode === 'create' ? handleCreateGoal : handleEditGoal}
        locale={locale}
      />
    </div>
  )
}