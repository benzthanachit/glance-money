'use client'

import React, { useState, useEffect } from 'react'
import { GoalWithProgress, Transaction } from '@/lib/types'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { transactionService } from '@/lib/services/transactionService'
import { goalService } from '@/lib/services/goalService'
import { CurrencyFormatter } from '@/components/ui/currency-formatter'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface GoalAllocationDialogProps {
    goal: GoalWithProgress
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    currency: string
    locale: 'th' | 'en'
}

export function GoalAllocationDialog({
    goal,
    isOpen,
    onClose,
    onSuccess,
    currency,
    locale
}: GoalAllocationDialogProps) {
    const [amount, setAmount] = useState('')
    const [selectedTransactionId, setSelectedTransactionId] = useState<string>('balance')
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Fetch recent income transactions to allocate from
    useEffect(() => {
        if (isOpen) {
            loadTransactions()
        }
    }, [isOpen])

    const loadTransactions = async () => {
        try {
            setLoading(true)
            // Fetch recent income transactions that haven't been fully allocated
            // For simplicity, we just fetch recent income for now
            const data = await transactionService.getTransactions({
                limit: 20
            })
            // Filter for income only and cast to appropriate type if needed
            setTransactions(data.filter(t => t.type === 'income') as any[])
        } catch (error) {
            console.error('Failed to load transactions:', error)
            toast.error('Failed to load available transactions')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!amount || isNaN(parseFloat(amount))) {
            toast.error('Please enter a valid amount')
            return
        }

        try {
            setSubmitting(true)

            // If allocating from specific transaction
            if (selectedTransactionId !== 'balance') {
                await goalService.allocateTransaction(
                    goal.id,
                    selectedTransactionId,
                    parseFloat(amount)
                )
            } else {
                // Direct allocation (creates a database entry without linking to specific transaction if system supports it,
                // or we might need to handle "from balance" differently in backend.
                // For now, assuming direct allocation adds to current_amount)
                await goalService.updateGoal(goal.id, {
                    current_amount: goal.currentAmount + parseFloat(amount)
                } as any)
            }

            toast.success('Funds allocated successfully')
            onSuccess()
            onClose()
            setAmount('')
        } catch (error) {
            console.error('Failed to allocate funds:', error)
            toast.error('Failed to allocate funds')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Allocate to {goal.name}</DialogTitle>
                    <DialogDescription>
                        Add funds to this goal from your available balance or specific transactions.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="source">Source</Label>
                        <Select
                            value={selectedTransactionId}
                            onValueChange={setSelectedTransactionId}
                            disabled={loading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="balance">
                                    Available Balance (Direct Deposit)
                                </SelectItem>
                                {transactions.map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.category} - <CurrencyFormatter amount={t.amount} currency={currency as any} locale={locale} />
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <div className="relative">
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                step="0.01"
                                required
                            />
                            <div className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                                {currency}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target:</span>
                        <span>
                            <CurrencyFormatter amount={goal.targetAmount} currency={currency as any} locale={locale} />
                        </span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining:</span>
                        <span>
                            <CurrencyFormatter
                                amount={Math.max(0, goal.targetAmount - goal.currentAmount)}
                                currency={currency as any}
                                locale={locale}
                            />
                        </span>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Allocate
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
