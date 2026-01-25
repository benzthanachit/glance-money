'use client'

import React, { useState, useEffect } from 'react'
import { Transaction } from '@/lib/types/database'
import { recurringTransactionService } from '@/lib/services/recurringTransactionService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CurrencyFormatter } from '@/components/ui/currency-formatter'
import { DateFormatter } from '@/components/ui/date-formatter'
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Calendar, 
  RefreshCw, 
  Plus,
  Eye,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface RecurringTransactionWithStatus extends Transaction {
  isActive: boolean
  nextDueDate: Date
}

interface RecurringTransactionManagerProps {
  onCreateNew?: () => void
}

export function RecurringTransactionManager({ onCreateNew }: RecurringTransactionManagerProps) {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransactionWithStatus[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransactionWithStatus | null>(null)
  const [instances, setInstances] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showInstances, setShowInstances] = useState(false)

  useEffect(() => {
    loadRecurringTransactions()
  }, [])

  const loadRecurringTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/transactions/recurring')
      if (!response.ok) {
        throw new Error('Failed to fetch recurring transactions')
      }
      const data = await response.json()
      setRecurringTransactions(data.recurringTransactions)
    } catch (error) {
      console.error('Error loading recurring transactions:', error)
      toast.error('Failed to load recurring transactions')
    } finally {
      setLoading(false)
    }
  }

  const loadInstances = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/recurring/${transactionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch instances')
      }
      const data = await response.json()
      setInstances(data.instances)
    } catch (error) {
      console.error('Error loading instances:', error)
      toast.error('Failed to load transaction instances')
    }
  }

  const handleToggleActive = async (transactionId: string) => {
    try {
      setActionLoading(transactionId)
      const response = await fetch(`/api/transactions/recurring/${transactionId}/toggle`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to toggle recurring transaction')
      }
      
      const data = await response.json()
      toast.success(data.message)
      await loadRecurringTransactions()
    } catch (error) {
      console.error('Error toggling recurring transaction:', error)
      toast.error('Failed to toggle recurring transaction')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (transactionId: string, deleteInstances: boolean = false) => {
    try {
      setActionLoading(transactionId)
      const response = await fetch(
        `/api/transactions/recurring/${transactionId}?deleteInstances=${deleteInstances}`, 
        {
          method: 'DELETE',
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to delete recurring transaction')
      }
      
      toast.success('Recurring transaction deleted successfully')
      await loadRecurringTransactions()
    } catch (error) {
      console.error('Error deleting recurring transaction:', error)
      toast.error('Failed to delete recurring transaction')
    } finally {
      setActionLoading(null)
    }
  }

  const handleGenerateMonthly = async () => {
    try {
      setActionLoading('generate')
      const response = await fetch('/api/transactions/recurring', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate recurring transactions')
      }
      
      const data = await response.json()
      toast.success(data.message)
    } catch (error) {
      console.error('Error generating recurring transactions:', error)
      toast.error('Failed to generate recurring transactions')
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewInstances = async (transaction: RecurringTransactionWithStatus) => {
    setSelectedTransaction(transaction)
    await loadInstances(transaction.id)
    setShowInstances(true)
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Food': '🍽️',
      'Transport': '🚗',
      'Fixed Cost': '🏠',
      'DCA': '📈',
      'Salary': '💰',
      'Freelance': '💼',
    }
    return icons[category] || '💳'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading recurring transactions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Recurring Transactions</h2>
          <p className="text-muted-foreground">
            Manage your monthly recurring income and expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateMonthly}
            disabled={actionLoading === 'generate'}
            variant="outline"
          >
            {actionLoading === 'generate' ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Generate Monthly
          </Button>
          {onCreateNew && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Recurring
            </Button>
          )}
        </div>
      </div>

      {/* Recurring Transactions List */}
      {recurringTransactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recurring Transactions</h3>
            <p className="text-muted-foreground text-center mb-4">
              Set up recurring transactions to automatically track your monthly income and expenses.
            </p>
            {onCreateNew && (
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Recurring Transaction
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recurringTransactions.map((transaction) => (
            <Card key={transaction.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(transaction.category)}</span>
                    <div>
                      <CardTitle className="text-lg">{transaction.category}</CardTitle>
                      <CardDescription>{transaction.description || 'No description'}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={transaction.isActive ? 'default' : 'secondary'}>
                    {transaction.isActive ? 'Active' : 'Paused'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <div className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    <CurrencyFormatter amount={transaction.amount} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next Due</span>
                  <DateFormatter date={transaction.nextDueDate} />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(transaction.id)}
                    disabled={actionLoading === transaction.id}
                  >
                    {transaction.isActive ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewInstances(transaction)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Recurring Transaction</DialogTitle>
                        <DialogDescription>
                          This will delete the recurring transaction template. What would you like to do with the generated instances?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-2 pt-4">
                        <Button
                          onClick={() => handleDelete(transaction.id, false)}
                          disabled={actionLoading === transaction.id}
                          variant="outline"
                        >
                          Keep Generated Transactions
                        </Button>
                        <Button
                          onClick={() => handleDelete(transaction.id, true)}
                          disabled={actionLoading === transaction.id}
                          variant="destructive"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Delete All Transactions
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instances Dialog */}
      <Dialog open={showInstances} onOpenChange={setShowInstances}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Generated Instances: {selectedTransaction?.category}
            </DialogTitle>
            <DialogDescription>
              All transactions generated from this recurring template
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {instances.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No instances generated yet
              </p>
            ) : (
              instances.map((instance) => (
                <div
                  key={instance.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <DateFormatter date={new Date(instance.date)} />
                    {instance.description && (
                      <p className="text-sm text-muted-foreground">{instance.description}</p>
                    )}
                  </div>
                  <div className={`font-semibold ${
                    instance.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {instance.type === 'income' ? '+' : '-'}
                    <CurrencyFormatter amount={instance.amount} />
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}