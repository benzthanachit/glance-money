'use client'

import React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui'
import { Trash2, Calendar, CreditCard } from 'lucide-react'
import { CurrencyFormatter } from '@/components/ui/currency-formatter'

import { Subscription } from '@/types/subscription'

interface SubscriptionListProps {
    subscriptions: Subscription[]
    loading: boolean
    error: string | null
    onToggle: (id: string, active: boolean) => void
    onDelete: (id: string) => void
}

export function SubscriptionList({
    subscriptions,
    loading,
    error,
    onToggle,
    onDelete
}: SubscriptionListProps) {
    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">Loading subscriptions...</div>
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">Error: {error}</div>
    }

    const totalMonthly = subscriptions
        .filter(sub => sub.active)
        .reduce((sum, sub) => sum + sub.amount, 0)

    return (
        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6 flex justify-between items-center">
                    <div>
                        <h3 className="tex-sm font-medium text-muted-foreground">Total Monthly Cost</h3>
                        <div className="text-3xl font-bold text-primary mt-1">
                            <CurrencyFormatter amount={totalMonthly} />
                        </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                        {subscriptions.filter(s => s.active).length} Active Subscriptions
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {subscriptions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
                        No subscriptions found. Add one to get started!
                    </div>
                ) : (
                    subscriptions.map((sub) => (
                        <Card key={sub.id} className={`transition-opacity ${!sub.active ? 'opacity-60' : ''}`}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`p-2 rounded-full ${sub.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{sub.name}</h4>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            Every {sub.payment_date}{getOrdinalSuffix(sub.payment_date)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="font-bold">
                                            <CurrencyFormatter amount={sub.amount} />
                                        </div>
                                        <div className="text-xs text-muted-foreground">per month</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={sub.active}
                                            onCheckedChange={(checked: boolean) => onToggle(sub.id, checked)}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this subscription?')) {
                                                    onDelete(sub.id)
                                                }
                                            }}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

function getOrdinalSuffix(i: number) {
    const j = i % 10,
        k = i % 100
    if (j == 1 && k != 11) {
        return 'st'
    }
    if (j == 2 && k != 12) {
        return 'nd'
    }
    if (j == 3 && k != 13) {
        return 'rd'
    }
    return 'th'
}
