'use client'

import { useState, useEffect, useMemo } from 'react'
import { Transaction } from '@/lib/types/database'
import { Category } from '@/lib/types/database'
import { categoryService } from '@/lib/services/categoryService'

interface UseCategoryFilterProps {
  transactions: Transaction[]
  initialCategory?: string
  transactionType?: 'income' | 'expense' | 'both'
}

interface UseCategoryFilterReturn {
  // Filter state
  selectedCategory: string
  setSelectedCategory: (categoryId: string) => void
  clearFilter: () => void
  
  // Available categories
  categories: Category[]
  categoriesLoading: boolean
  
  // Filtered data
  filteredTransactions: Transaction[]
  
  // Category statistics
  categoryStats: {
    totalTransactions: number
    filteredTransactions: number
    availableCategories: string[]
  }
}

export function useCategoryFilter({
  transactions,
  initialCategory = '',
  transactionType = 'both'
}: UseCategoryFilterProps): UseCategoryFilterReturn {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true)
        const fetchedCategories = await categoryService.getCategories({ type: transactionType })
        setCategories(fetchedCategories.length > 0 ? fetchedCategories : categoryService.getDefaultCategories())
      } catch (error) {
        // Fallback to default categories if API fails
        setCategories(categoryService.getDefaultCategories())
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [transactionType])

  // Filter transactions by selected category
  const filteredTransactions = useMemo(() => {
    if (!selectedCategory) return transactions
    return transactions.filter(transaction => transaction.category === selectedCategory)
  }, [transactions, selectedCategory])

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const availableCategories = [...new Set(transactions.map(t => t.category))]
    
    return {
      totalTransactions: transactions.length,
      filteredTransactions: filteredTransactions.length,
      availableCategories
    }
  }, [transactions, filteredTransactions])

  const clearFilter = () => {
    setSelectedCategory('')
  }

  return {
    selectedCategory,
    setSelectedCategory,
    clearFilter,
    categories,
    categoriesLoading,
    filteredTransactions,
    categoryStats
  }
}