'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Transaction } from '@/lib/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CurrencyFormatter } from '@/components/ui/currency-formatter'
import { DateFormatter } from '@/components/ui/date-formatter'
import { CategoryFilter } from './category-filter'
import { categoryService } from '@/lib/services/categoryService'
import { useTransactionSubscription } from '@/lib/hooks/useTransactionSubscription'
import { useAuth } from '@/lib/auth/context'
import { Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  groupBy?: 'date' | 'category'
  categoryFilter?: string
  onCategoryFilterChange?: (categoryId: string) => void
  showCategoryFilter?: boolean
  className?: string
  onTransactionUpdate?: (transactions: Transaction[]) => void
}

interface GroupedTransactions {
  [key: string]: Transaction[]
}

export function TransactionList({ 
  transactions, 
  onEdit, 
  onDelete, 
  groupBy = 'date',
  categoryFilter = '',
  onCategoryFilterChange,
  showCategoryFilter = false,
  className,
  onTransactionUpdate
}: TransactionListProps) {
  const { user } = useAuth()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions)

  // Set up real-time subscription for transaction updates
  const { isConnected, error: subscriptionError } = useTransactionSubscription({
    userId: user?.id,
    onInsert: (newTransaction) => {
      console.log('Transaction inserted in list:', newTransaction)
      setLocalTransactions(prev => {
        const updated = [newTransaction, ...prev.filter(t => t.id !== newTransaction.id)]
        onTransactionUpdate?.(updated)
        return updated
      })
    },
    onUpdate: (updatedTransaction) => {
      console.log('Transaction updated in list:', updatedTransaction)
      setLocalTransactions(prev => {
        const updated = prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
        onTransactionUpdate?.(updated)
        return updated
      })
    },
    onDelete: (deletedTransactionId) => {
      console.log('Transaction deleted in list:', deletedTransactionId)
      setLocalTransactions(prev => {
        const updated = prev.filter(t => t.id !== deletedTransactionId)
        onTransactionUpdate?.(updated)
        return updated
      })
    }
  })

  // Update local transactions when props change
  useEffect(() => {
    setLocalTransactions(transactions)
  }, [transactions])

  // Get default categories for icon lookup
  const getCategoryIcon = (categoryId: string): string => {
    return categoryService.getCategoryIcon(categoryId)
  }

  const getCategoryName = (categoryId: string): string => {
    return categoryService.getCategoryName(categoryId)
  }

  // Filter transactions by category if filter is applied
  const filteredTransactions = useMemo(() => {
    if (!categoryFilter) return localTransactions
    return localTransactions.filter(transaction => transaction.category === categoryFilter)
  }, [localTransactions, categoryFilter])

  // Sort transactions chronologically (newest first)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Group transactions if needed
  const groupedTransactions: GroupedTransactions = sortedTransactions.reduce((groups, transaction) => {
    let key: string
    
    if (groupBy === 'date') {
      key = new Date(transaction.date).toDateString()
    } else {
      key = getCategoryName(transaction.category)
    }
    
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(transaction)
    
    return groups
  }, {} as GroupedTransactions)

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (transactionToDelete) {
      onDelete(transactionToDelete.id)
      setDeleteDialogOpen(false)
      setTransactionToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setTransactionToDelete(null)
  }

  const renderTransaction = (transaction: Transaction) => (
    <Card key={transaction.id} className={cn("mb-3 last:mb-0", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left side: Icon, Category, Description */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-lg">{getCategoryIcon(transaction.category)}</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-sm truncate">
                  {getCategoryName(transaction.category)}
                </h3>
                <div className="flex-shrink-0">
                  {transaction.type === 'income' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              
              {transaction.description && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {transaction.description}
                </p>
              )}
              
              <div className="flex items-center space-x-2 mt-1">
                <DateFormatter 
                  date={new Date(transaction.date)} 
                  format="short"
                  className="text-xs text-muted-foreground"
                />
                {transaction.is_recurring && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Recurring
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Amount and Actions */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="text-right">
              <div className={cn(
                "font-semibold",
                transaction.type === 'income' ? "text-green-600" : "text-red-600"
              )}>
                {transaction.type === 'income' ? '+' : '-'}
                <CurrencyFormatter amount={transaction.amount} />
              </div>
            </div>
            
            {/* Action buttons - hidden on mobile, visible on desktop */}
            <div className="hidden md:flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(transaction.id)}
                className="h-8 w-8"
              >
                <Edit2 className="w-4 h-4" />
                <span className="sr-only">Edit transaction</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDeleteClick(transaction)}
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Delete transaction</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile action buttons - visible on mobile only */}
        <div className="md:hidden flex justify-end space-x-2 mt-3 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(transaction.id)}
            className="flex-1"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteClick(transaction)}
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (filteredTransactions.length === 0 && localTransactions.length > 0) {
    // Show message when filter results in no transactions
    return (
      <div className={cn("space-y-4", className)}>
        {showCategoryFilter && onCategoryFilterChange && (
          <CategoryFilter
            selectedCategory={categoryFilter}
            onCategoryChange={onCategoryFilterChange}
            transactionType="both"
          />
        )}
        
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No transactions found
          </h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your category filter or add new transactions
          </p>
        </div>
      </div>
    )
  }

  if (localTransactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">📝</span>
        </div>
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No transactions yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Start tracking your expenses by adding your first transaction
        </p>
        {subscriptionError && (
          <p className="text-xs text-red-600 mt-2">
            Real-time updates unavailable: {subscriptionError}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Category Filter */}
      {showCategoryFilter && onCategoryFilterChange && (
        <CategoryFilter
          selectedCategory={categoryFilter}
          onCategoryChange={onCategoryFilterChange}
          transactionType="both"
        />
      )}

      {/* Real-time status indicator */}
      {subscriptionError && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">
          Real-time updates unavailable: {subscriptionError}
        </div>
      )}

      {/* Transaction Groups */}
      {Object.entries(groupedTransactions).map(([groupKey, groupTransactions]) => (
        <div key={groupKey}>
          {/* Group header */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 mb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {groupBy === 'date' ? (
                  <DateFormatter 
                    date={new Date(groupKey)} 
                    format="long"
                  />
                ) : (
                  groupKey
                )}
              </h2>
              {isConnected && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {groupTransactions.length} transaction{groupTransactions.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {/* Transactions in group */}
          <div className="space-y-2">
            {groupTransactions.map(renderTransaction)}
          </div>
        </div>
      ))}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {transactionToDelete && (
            <div className="py-4">
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <span className="text-lg">
                  {getCategoryIcon(transactionToDelete.category)}
                </span>
                <div className="flex-1">
                  <div className="font-medium">
                    {getCategoryName(transactionToDelete.category)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <DateFormatter date={new Date(transactionToDelete.date)} format="medium" />
                  </div>
                </div>
                <div className={cn(
                  "font-semibold",
                  transactionToDelete.type === 'income' ? "text-green-600" : "text-red-600"
                )}>
                  {transactionToDelete.type === 'income' ? '+' : '-'}
                  <CurrencyFormatter amount={transactionToDelete.amount} />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}