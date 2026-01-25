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
import { Plus, Calendar, List } from 'lucide-react'

type TabType = 'transactions' | 'recurring'

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('transactions')
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [isRecurringMode, setIsRecurringMode] = useState(false)

  const handleCreateTransaction = async (data: TransactionData) => {
    try {
      await offlineTransactionService.createTransaction({
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description,
        date: data.date.toISOString().split('T')[0],
        is_recurring: data.isRecurring,
      })
      
      const isOffline = offlineTransactionService.connectionStatus === 'offline'
      
      toast.success(
        data.isRecurring 
          ? 'Recurring transaction created successfully' 
          : 'Transaction created successfully',
        {
          description: isOffline ? 'Saved locally. Will sync when online.' : undefined
        }
      )
      setShowTransactionForm(false)
      setIsRecurringMode(false)
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error('Failed to create transaction')
    }
  }

  const handleCreateRecurring = () => {
    setIsRecurringMode(true)
    setShowTransactionForm(true)
  }

  const handleCreateRegular = () => {
    setIsRecurringMode(false)
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
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'transactions'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="h-4 w-4" />
          All Transactions
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'recurring'
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
          
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Regular transaction list functionality will be implemented in upcoming tasks.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'recurring' && (
        <RecurringTransactionManager onCreateNew={handleCreateRecurring} />
      )}

      {/* Transaction Form Dialog */}
      <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isRecurringMode ? 'Create Recurring Transaction' : 'Add Transaction'}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            mode="create"
            initialData={isRecurringMode ? { isRecurring: true } : undefined}
            onSubmit={handleCreateTransaction}
            onCancel={() => setShowTransactionForm(false)}
          />
        </DialogContent>
      </Dialog>
    </ResponsiveLayout>
    </ProtectedRoute>
  )
}