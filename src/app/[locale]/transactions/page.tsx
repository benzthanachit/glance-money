'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ResponsiveLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecurringTransactionManager } from '@/components/transactions/recurring-transaction-manager'
import { TransactionList } from '@/components/transactions/transaction-list'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { OfflineIndicator } from '@/components/ui/offline-indicator'
import { offlineTransactionService } from '@/lib/services/offlineTransactionService'
import { TransactionData } from '@/lib/types'
import { toast } from 'sonner'
import { Plus, Calendar, List, AlertCircle } from 'lucide-react'
import { transactionService } from '@/lib/services/transactionService'
import { goalService } from '@/lib/services/goalService'
import { Transaction } from '@/lib/types/database'
import { useEffect } from 'react'

type TabType = 'transactions' | 'recurring'

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('transactions')
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [isRecurringMode, setIsRecurringMode] = useState(false)
  const [recurringRefreshTrigger, setRecurringRefreshTrigger] = useState(0)

  // Transaction List State
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const data = await transactionService.getTransactions()
      setTransactions(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions()
    }
  }, [activeTab])

  const handleEditTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id)
    if (transaction) {
      setEditingTransaction(transaction)
      setFormMode('edit')
      setIsRecurringMode(false)
      setShowTransactionForm(true)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionService.deleteTransaction(id)
      toast.success('Transaction deleted successfully')
      // Refresh list
      fetchTransactions()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to delete transaction')
    }
  }

  const handleCreateTransaction = async (data: TransactionData) => {
    try {
      if (formMode === 'edit' && editingTransaction) {
        await transactionService.updateTransaction(editingTransaction.id, {
          amount: data.amount,
          type: data.type,
          category: data.category,
          description: data.description,
          date: data.date.toISOString().split('T')[0],
          is_recurring: data.isRecurring
        })
        toast.success('Transaction updated successfully')
      } else {
        const createdTransaction = await offlineTransactionService.createTransaction({
          amount: data.amount,
          type: data.type,
          category: data.category,
          description: data.description,
          date: data.date.toISOString().split('T')[0],
          is_recurring: data.isRecurring,
        })

        // Handle Goal Allocation
        if (data.linkedGoalId && data.linkedGoalId !== 'no-goal' && data.allocationAmount) {
          try {
            // Format amount (ensure positive)
            const allocAmount = Math.abs(data.allocationAmount);

            // If we have an ID (online mode or consistent ID generation), use it.
            // offlineTransactionService.createTransaction might return void or the object depending on implementation.
            // Let's check the return type of creates.
            // It returns Promise<Transaction>.
            if (createdTransaction && createdTransaction.id) {
              await goalService.allocateTransaction(
                data.linkedGoalId,
                createdTransaction.id,
                allocAmount
              );
            }
          } catch (goalError) {
            console.error('Failed to allocate to goal:', goalError);
            toast.error('Transaction created, but failed to update goal progress');
          }
        }

        const isOffline = offlineTransactionService.connectionStatus === 'offline'

        toast.success(
          data.isRecurring
            ? 'Recurring transaction created successfully'
            : 'Transaction created successfully',
          {
            description: isOffline ? 'Saved locally. Will sync when online.' : undefined
          }
        )
      }

      setShowTransactionForm(false)
      setIsRecurringMode(false)
      setEditingTransaction(undefined)
      setFormMode('create')
      fetchTransactions()
      // Trigger recurring transactions refresh
      setRecurringRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error saving transaction:', error)
      toast.error('Failed to save transaction')
    }
  }

  const handleCreateRecurring = () => {
    setIsRecurringMode(true)
    setFormMode('create')
    setEditingTransaction(undefined)
    setShowTransactionForm(true)
  }

  const handleCreateRegular = () => {
    setIsRecurringMode(false)
    setFormMode('create')
    setEditingTransaction(undefined)
    setShowTransactionForm(true)
  }

  return (
    <ProtectedRoute>
      <ResponsiveLayout currentPage="transactions">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
              <p className="text-muted-foreground">Manage your income and expenses</p>
            </div>
            <OfflineIndicator className="hidden md:flex" />
          </div>

          {/* Mobile offline indicator */}
          <div className="mt-4 md:hidden">
            <OfflineIndicator />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'transactions'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <List className="h-4 w-4" />
            All Transactions
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'recurring'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Calendar className="h-4 w-4" />
            Recurring
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleCreateRegular}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>

            <TransactionList
              transactions={transactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              groupBy="date"
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              showCategoryFilter={true}
            />
          </div>
        )}

        {activeTab === 'recurring' && (
          <RecurringTransactionManager
            onCreateNew={handleCreateRecurring}
            refreshTrigger={recurringRefreshTrigger}
          />
        )}

        {/* Transaction Form Dialog */}
        <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isRecurringMode ? 'Create Recurring Transaction' : 'Add Transaction'}
              </DialogTitle>
            </DialogHeader>
            <TransactionForm
              mode={formMode}
              initialData={
                formMode === 'edit' && editingTransaction
                  ? {
                    amount: editingTransaction.amount,
                    type: editingTransaction.type,
                    category: editingTransaction.category,
                    description: editingTransaction.description || '',
                    date: new Date(editingTransaction.date),
                    isRecurring: editingTransaction.is_recurring
                  }
                  : (isRecurringMode ? { isRecurring: true } : undefined)
              }
              onSubmit={handleCreateTransaction}
              onCancel={() => {
                setShowTransactionForm(false)
                setEditingTransaction(undefined)
                setFormMode('create')
              }}
            />
          </DialogContent>
        </Dialog>
      </ResponsiveLayout>
    </ProtectedRoute>
  )
}