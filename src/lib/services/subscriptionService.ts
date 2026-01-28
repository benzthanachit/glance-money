import { createClient } from '@/lib/supabase/client'
import { Subscription, CreateSubscriptionData, UpdateSubscriptionData } from '@/types/subscription'

class SubscriptionService {
    private supabase = createClient()

    async getSubscriptions(userId: string): Promise<Subscription[]> {
        const { data, error } = await this.supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .order('payment_date', { ascending: true })

        if (error) {
            throw new Error(error.message)
        }

        return data || []
    }

    async addSubscription(data: CreateSubscriptionData): Promise<Subscription> {
        const { data: userData, error: userError } = await this.supabase.auth.getUser()
        if (userError || !userData.user) {
            throw new Error('User not authenticated')
        }

        const { data: newSubscription, error } = await this.supabase
            .from('subscriptions')
            .insert({
                ...data,
                user_id: userData.user.id,
            })
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        return newSubscription
    }

    async updateSubscription(id: string, data: UpdateSubscriptionData): Promise<Subscription> {
        const { data: updatedSubscription, error } = await this.supabase
            .from('subscriptions')
            .update({
                ...data,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        return updatedSubscription
    }

    async deleteSubscription(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('subscriptions')
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(error.message)
        }
    }

    async toggleSubscription(id: string, active: boolean): Promise<Subscription> {
        return this.updateSubscription(id, { active })
    }
}

export const subscriptionService = new SubscriptionService()
