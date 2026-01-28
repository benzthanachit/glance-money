import { useState, useEffect } from 'react'
import { Subscription, CreateSubscriptionData, UpdateSubscriptionData } from '@/types/subscription'
import { subscriptionService } from '@/lib/services/subscriptionService'
import { createClient } from '@/lib/supabase/client'

export function useSubscriptions() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSubscriptions = async () => {
        try {
            setLoading(true)
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setSubscriptions([])
                return
            }

            const data = await subscriptionService.getSubscriptions(user.id)
            setSubscriptions(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSubscriptions()
    }, [])

    const addSubscription = async (data: CreateSubscriptionData) => {
        try {
            const newSub = await subscriptionService.addSubscription(data)
            setSubscriptions(prev => [...prev, newSub].sort((a, b) => a.payment_date - b.payment_date))
            return newSub
        } catch (err: any) {
            throw err
        }
    }

    const updateSubscription = async (id: string, data: UpdateSubscriptionData) => {
        try {
            const updatedSub = await subscriptionService.updateSubscription(id, data)
            setSubscriptions(prev =>
                prev.map(sub => sub.id === id ? updatedSub : sub)
                    .sort((a, b) => a.payment_date - b.payment_date)
            )
            return updatedSub
        } catch (err: any) {
            throw err
        }
    }

    const deleteSubscription = async (id: string) => {
        try {
            await subscriptionService.deleteSubscription(id)
            setSubscriptions(prev => prev.filter(sub => sub.id !== id))
        } catch (err: any) {
            throw err
        }
    }

    const toggleSubscription = async (id: string, active: boolean) => {
        return updateSubscription(id, { active })
    }

    return {
        subscriptions,
        loading,
        error,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        toggleSubscription,
        refresh: fetchSubscriptions
    }
}
