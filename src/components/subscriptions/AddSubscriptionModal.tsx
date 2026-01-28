'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { Plus } from 'lucide-react'

interface AddSubscriptionModalProps {
    onSubscriptionAdded: () => void
}

export function AddSubscriptionModal({ onSubscriptionAdded }: AddSubscriptionModalProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')
    const [paymentDate, setPaymentDate] = useState('1')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { addSubscription } = useSubscriptions()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            await addSubscription({
                name,
                amount: parseFloat(amount),
                payment_date: parseInt(paymentDate),
                active: true,
                description: description || undefined,
            })

            onSubscriptionAdded()
            setOpen(false)
            // Reset form
            setName('')
            setAmount('')
            setPaymentDate('1')
            setDescription('')
        } catch (error) {
            console.error('Failed to add subscription:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Subscription
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Subscription</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="Netflix, Spotify..."
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Amount
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="col-span-3"
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Day of Month
                        </Label>
                        <Input
                            id="date"
                            type="number"
                            min="1"
                            max="31"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Description
                        </Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="col-span-3"
                            placeholder="Optional note"
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Subscription'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
