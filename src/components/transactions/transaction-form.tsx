'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { CategorySelector } from '@/components/ui/category-selector'
import { TransactionFormProps, TransactionData } from '@/lib/types'
import { Category } from '@/lib/types/database'
import { categoryService } from '@/lib/services/categoryService'
import { validateTransactionData, ValidationError } from '@/lib/utils/validation'
import { cn } from '@/lib/utils'
import { goalService } from '@/lib/services/goalService'
import { GoalWithProgress } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyFormatter } from '@/components/ui/currency-formatter'

interface FormData {
  amount: string
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
  isRecurring: boolean
  linkedGoalId: string
  allocationAmount: string
}

interface FormErrors {
  [key: string]: string
}

export function TransactionForm({ mode, initialData, onSubmit, onCancel }: TransactionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    amount: initialData?.amount?.toString() || '',
    type: initialData?.type || 'expense',
    category: initialData?.category || '',
    description: initialData?.description || '',
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    isRecurring: initialData?.isRecurring || false,
    linkedGoalId: '',
    allocationAmount: initialData?.amount?.toString() || '',
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load categories and goals on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedCategories, fetchedGoals] = await Promise.all([
          categoryService.getCategories(),
          goalService.getGoals({ completed: false })
        ])

        setCategories(fetchedCategories.length > 0 ? fetchedCategories : categoryService.getDefaultCategories())
        setGoals(fetchedGoals)
      } catch (error) {
        // Fallback to default categories if API fails
        setCategories(categoryService.getDefaultCategories())
        console.error('Failed to load form data:', error)
      }
    }
    loadData()
  }, [])

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(
    category => category.type === formData.type || category.type === 'both'
  )

  // Side effect: Sync allocation amount when main amount changes if goal is linked
  useEffect(() => {
    if (formData.linkedGoalId && formData.linkedGoalId !== 'no-goal') {
      setFormData(prev => ({ ...prev, allocationAmount: prev.amount }))
    }
  }, [formData.amount, formData.linkedGoalId])

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-fill allocation amount if linking logic implies full amount
    // Removed duplicate logic here since useEffect handles it more reliably

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleTypeToggle = (type: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      type,
      category: '' // Reset category when type changes
    }))

    // Clear category error when type changes
    if (errors.category) {
      setErrors(prev => ({
        ...prev,
        category: ''
      }))
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryId
    }))

    // Clear category error when selected
    if (errors.category) {
      setErrors(prev => ({
        ...prev,
        category: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    // If a goal is linked, we allow empty category
    // We create a temporary object for validation that satisfies the strict requirements
    // or we manually skip the category check for the UI error state.

    const isGoalLinked = formData.linkedGoalId && formData.linkedGoalId !== 'no-goal'

    // For validation purposes, if goal is linked, we provide a placeholder category
    // so validateTransactionData doesn't complain. The actual data submitted will be handled in handleSubmit.
    const transactionDataForValidation = {
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: isGoalLinked && !formData.category ? '22d2169c-9213-4d69-9cc9-4f5393846553' : formData.category,
      description: formData.description || undefined,
      date: formData.date,
      isRecurring: formData.isRecurring,
    }

    const validation = validateTransactionData(transactionDataForValidation)

    if (!validation.isValid) {
      const newErrors: FormErrors = {}
      validation.errors.forEach((error: ValidationError) => {
        // Double check: if it's a category error but we have a goal, ignore it? 
        // We already faked the category above, so it shouldn't error. 
        // But in case logic changes, let's filter.
        if (error.field === 'category' && isGoalLinked) return

        newErrors[error.field] = error.message
      })

      // If we have errors other than category (or including it if not linked), fail
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return false
      }
    }

    setErrors({})
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const transactionData: TransactionData = {
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        description: formData.description || undefined,
        date: new Date(formData.date),
        isRecurring: formData.isRecurring,
      }

      // If linked to a goal, we modify the transaction data to include allocation info
      // and ensure category is treated as 'goal-allocation' or similar if empty.

      const finalTransactionData: TransactionData = {
        ...transactionData,
        // If linked to goal, ensure we pass the allocation info
        linkedGoalId: formData.linkedGoalId === 'no-goal' ? undefined : formData.linkedGoalId,
        allocationAmount: (formData.linkedGoalId && formData.linkedGoalId !== 'no-goal') ? parseFloat(formData.allocationAmount) : undefined,
        // If linked to goal, force category to be 'goal-allocation' to pass server validation
        // while indicating it's a special transaction type.
        // If linked to goal, force category to be the hardcoded Goal Category ID
        // as requested by user.
        category: (formData.linkedGoalId && formData.linkedGoalId !== 'no-goal') ? '22d2169c-9213-4d69-9cc9-4f5393846553' : transactionData.category
      }

      await onSubmit(finalTransactionData)
    } catch (error) {
      console.error('Error submitting transaction:', error)
      // Handle submission error - could set a general error state here
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {mode === 'create' ? 'Add Transaction' : 'Edit Transaction'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Income/Expense Toggle */}
        <div className="flex rounded-lg overflow-hidden border">
          <Button
            type="button"
            onClick={() => handleTypeToggle('expense')}
            className={cn(
              "flex-1 rounded-none",
              formData.type === 'expense' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-muted hover:bg-muted/80 text-foreground'
            )}
          >
            Expense
          </Button>
          <Button
            type="button"
            onClick={() => handleTypeToggle('income')}
            className={cn(
              "flex-1 rounded-none",
              formData.type === 'income' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-muted hover:bg-muted/80 text-foreground'
            )}
          >
            Income
          </Button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            max="999999999.99"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            className={cn(
              "text-lg h-12 text-center font-semibold",
              errors.amount && "border-red-500 focus-visible:ring-red-500/20"
            )}
            aria-invalid={!!errors.amount}
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount}</p>
          )}
        </div>

        {/* Goal Integration - Moved above Category */}
        {goals.length > 0 && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label>Link to Goal (Optional)</Label>
              <Select
                value={formData.linkedGoalId}
                onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    linkedGoalId: value,
                    // Set category to hardcoded ID if goal is selected
                    category: value !== 'no-goal' ? '22d2169c-9213-4d69-9cc9-4f5393846553' : prev.category,
                    allocationAmount: value !== 'no-goal' ? prev.amount : ''
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a goal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-goal">No Goal (Regular Transaction)</SelectItem>
                  {goals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.name} (Remaining: <CurrencyFormatter amount={goal.targetAmount - goal.currentAmount} />)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show allocation input only if explicitly needed, otherwise it sends full amount? 
                    User said: "expense of goal will use the same amount as transaction expense"
                    So we can probably show it as read-only or just hide it and say "100% allocated" 
                    or just leave it fully synced but visible for confirmation.
                */}
            {formData.linkedGoalId && formData.linkedGoalId !== 'no-goal' && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Transaction amount will be allocated to this goal.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Category Selector - Hidden if Goal is selected */}
        {(!formData.linkedGoalId || formData.linkedGoalId === 'no-goal') && (
          <div className="space-y-2">
            <Label>Category</Label>
            <CategorySelector
              categories={filteredCategories}
              selectedCategory={formData.category}
              onSelect={handleCategorySelect}
              variant="grid"
            />
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>
        )}

        {/* Description Input */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            type="text"
            placeholder="Add a note..."
            maxLength={500}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={cn(
              errors.description && "border-red-500 focus-visible:ring-red-500/20"
            )}
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        {/* Date Input */}
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className={cn(
              errors.date && "border-red-500 focus-visible:ring-red-500/20"
            )}
            aria-invalid={!!errors.date}
          />
          {errors.date && (
            <p className="text-sm text-red-500">{errors.date}</p>
          )}
        </div>

        {/* Recurring Transaction Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            id="recurring"
            type="checkbox"
            checked={formData.isRecurring}
            onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
          />
          <Label htmlFor="recurring" className="text-sm">
            Repeat monthly (recurring transaction)
          </Label>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add Transaction' : 'Update Transaction'}
          </Button>
        </div>
      </form>
    </div>
  )
}