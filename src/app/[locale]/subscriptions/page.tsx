'use client'

import { SubscriptionList } from '@/components/subscriptions/SubscriptionList'
import { AddSubscriptionModal } from '@/components/subscriptions/AddSubscriptionModal'
import { useTranslations } from 'next-intl'
import { ResponsiveLayout } from '@/components/layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useSubscriptions } from '@/hooks/useSubscriptions'

export default function SubscriptionsPage() {
    const t = useTranslations('Subscriptions')
    const {
        subscriptions,
        loading,
        error,
        toggleSubscription,
        deleteSubscription,
        refresh
    } = useSubscriptions()

    return (
        <ProtectedRoute>
            <ResponsiveLayout currentPage="subscriptions">
                <div className="container mx-auto py-8 px-4 max-w-4xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
                            <p className="text-muted-foreground mt-2">
                                Track your recurring monthly subscriptions.
                            </p>
                        </div>
                        <AddSubscriptionModal onSubscriptionAdded={refresh} />
                    </div>

                    <SubscriptionList
                        subscriptions={subscriptions}
                        loading={loading}
                        error={error}
                        onToggle={toggleSubscription}
                        onDelete={deleteSubscription}
                    />
                </div>
            </ResponsiveLayout>
        </ProtectedRoute>
    )
}
