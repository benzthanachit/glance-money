'use client'

import React from 'react'
import { Category } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface CategorySelectorProps {
  categories: Category[]
  selectedCategory: string
  onSelect: (categoryName: string) => void
  className?: string
  variant?: 'grid' | 'list'
  showAllOption?: boolean
}

export function CategorySelector({
  categories,
  selectedCategory,
  onSelect,
  className,
  variant = 'grid',
  showAllOption = false
}: CategorySelectorProps) {
  const handleCategorySelect = (categoryName: string) => {
    onSelect(categoryName)
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {showAllOption && (
          <button
            type="button"
            onClick={() => handleCategorySelect('')}
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left hover:bg-accent',
              selectedCategory === ''
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">📊</span>
              <span className="font-medium">All Categories</span>
            </div>
          </button>
        )}
        
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategorySelect(category.name)}
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left hover:bg-accent',
              selectedCategory === category.name
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{category.icon}</span>
              <span className="font-medium">{category.name}</span>
            </div>
            {selectedCategory === category.name && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3', className)}>
      {showAllOption && (
        <button
          type="button"
          onClick={() => handleCategorySelect('')}
          className={cn(
            'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all min-h-[80px] hover:bg-accent',
            selectedCategory === ''
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          )}
        >
          <span className="text-2xl mb-1">📊</span>
          <span className="text-xs font-medium text-center">All</span>
        </button>
      )}
      
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => handleCategorySelect(category.name)}
          className={cn(
            'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all min-h-[80px] hover:bg-accent relative',
            selectedCategory === category.name
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          )}
        >
          <span className="text-2xl mb-1">{category.icon}</span>
          <span className="text-xs font-medium text-center">{category.name}</span>
          {selectedCategory === category.name && (
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  )
}