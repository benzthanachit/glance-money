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

interface FormData {
  amount: string
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
  isRecurring: boolean
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
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await categoryService.getCategories()
        setCategories(fetchedCategories.length > 0 ? fetchedCategories : categoryService.getDefaultCategories())
      } catch (error) {
        // Fallback to default categories if API fails
        setCategories(categoryService.getDefaultCategories())
      }
    }
    loadCategories()
  }, [])

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(
    category => category.type === formData.type || category.type === 'both'
  )

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
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
    const transactionData = {
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      description: formData.description || undefined,
      date: formData.date,
      is_recurring: formData.isRecurring,
    }

    const validation = validateTransactionData(transactionData)
    
    if (!validation.isValid) {
      const newErrors: FormErrors = {}
      validation.errors.forEach((error: ValidationError) => {
        newErrors[error.field] = error.message
      })
      setErrors(newErrors)
      return false
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

      await onSubmit(transactionData)
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
        <div className="space-y-2">
          <Label>Transaction Type</Label>
          <div className="flex rounded-lg border p-1 bg-muted">
            <button
              type="button"
              onClick={() => handleTypeToggle('expense')}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                formData.type === 'expense'
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeToggle('income')}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                formData.type === 'income'
                  ? "bg-green-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Income
            </button>
          </div>
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

        {/* Category Selector */}
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