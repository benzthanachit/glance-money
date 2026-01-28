export interface Subscription {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    payment_date: number; // 1-31
    active: boolean;
    description?: string;
    created_at: string;
    updated_at: string;
}

export type CreateSubscriptionData = Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export type UpdateSubscriptionData = Partial<CreateSubscriptionData>;
