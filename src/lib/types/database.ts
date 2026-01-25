export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          preferences: UserPreferences
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          preferences?: UserPreferences
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          preferences?: UserPreferences
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string
          type: 'income' | 'expense' | 'both'
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          type: 'income' | 'expense' | 'both'
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          type?: 'income' | 'expense' | 'both'
          is_default?: boolean
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description: string | null
          date: string
          is_recurring: boolean
          recurring_parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description?: string | null
          date?: string
          is_recurring?: boolean
          recurring_parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          description?: string | null
          date?: string
          is_recurring?: boolean
          recurring_parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          current_amount: number
          deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_amount: number
          current_amount?: number
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_amount?: number
          current_amount?: number
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      goal_transactions: {
        Row: {
          id: string
          goal_id: string
          transaction_id: string
          allocated_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          transaction_id: string
          allocated_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          transaction_id?: string
          allocated_amount?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_net_status: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
      get_category_summary: {
        Args: {
          user_uuid: string
        }
        Returns: {
          category: string
          amount: number
          transaction_count: number
          percentage: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export interface UserPreferences {
  language: 'th' | 'en'
  currency: 'THB' | 'USD' | 'EUR'
  theme: 'light' | 'dark' | 'system'
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type Goal = Database['public']['Tables']['goals']['Row']
export type GoalInsert = Database['public']['Tables']['goals']['Insert']
export type GoalUpdate = Database['public']['Tables']['goals']['Update']

export type GoalTransaction = Database['public']['Tables']['goal_transactions']['Row']
export type GoalTransactionInsert = Database['public']['Tables']['goal_transactions']['Insert']
export type GoalTransactionUpdate = Database['public']['Tables']['goal_transactions']['Update']