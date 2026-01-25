'use client'

import React, { useState, useEffect } from 'react'
import { Category } from '@/lib/types/database'
import { CategorySelector } from '@/components/ui/category-selector'
import { categoryService } from '@/lib/services/categoryService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
  transactionType?: 'income' | 'expense' | 'both'
  className?: string
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  transactionType = 'both',
  className
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        const fetchedCategories = await categoryService.getCategories({ type: transactionType })
        setCategories(fetchedCategories.length > 0 ? fetchedCategories : categoryService.getDefaultCategories())
      } catch (error) {
        // Fallback to default categories if API fails
        setCategories(categoryService.getDefaultCategories())
      } finally {
        setLoading(false)
      }
    }
    loadCategories()
  }, [transactionType])

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(
    category => transactionType === 'both' || category.type === transactionType || category.type === 'both'
  )

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return 'All Categories'
    const category = filteredCategories.find(cat => cat.id === selectedCategory)
    return category?.name || 'Unknown Category'
  }

  const getSelectedCategoryIcon = () => {
    if (!selectedCategory) return '📊'
    const category = filteredCategories.find(cat => cat.id === selectedCategory)
    return category?.icon || '📝'
  }

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId)
    setIsDialogOpen(false)
  }

  const clearFilter = () => {
    onCategoryChange('')
  }

  if (loading) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* Mobile: Dialog trigger button */}
      <div className="md:hidden">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'flex items-center space-x-2 h-10',
                selectedCategory && 'border-primary bg-primary/10'
              )}
            >
              <span className="text-sm">{getSelectedCategoryIcon()}</span>
              <span className="text-sm font-medium truncate max-w-24">
                {getSelectedCategoryName()}
              </span>
              <Filter className="h-4 w-4 flex-shrink-0" />
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Filter by Category</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <CategorySelector
                categories={filteredCategories}
                selectedCategory={selectedCategory}
                onSelect={handleCategorySelect}
                variant="grid"
                showAllOption={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop: Inline category selector */}
      <div className="hidden md:block">
        <Card className="w-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Filter by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CategorySelector
              categories={filteredCategories}
              selectedCategory={selectedCategory}
              onSelect={onCategoryChange}
              variant="grid"
              showAllOption={true}
              className="grid-cols-4 lg:grid-cols-6"
            />
          </CardContent>
        </Card>
      </div>

      {/* Clear filter button - shown when a category is selected */}
      {selectedCategory && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearFilter}
          className="h-10 w-10 flex-shrink-0"
          title="Clear filter"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear category filter</span>
        </Button>
      )}
    </div>
  )
}