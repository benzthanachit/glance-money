import { Transaction, TransactionInsert, TransactionUpdate } from '@/lib/types/database'

export interface TransactionFilters {
  category?: string
  startDate?: string
  endDate?: string
  limit?: number
}

export interface CreateTransactionData {
  amount: number
  type: 'income' | 'expense'
  category: string
  description?: string
  date?: string
  is_recurring?: boolean
  recurring_parent_id?: string
}

export interface UpdateTransactionData {
  amount?: number
  type?: 'income' | 'expense'
  category?: string
  description?: string
  date?: string
  is_recurring?: boolean
}

class TransactionService {
  private baseUrl = '/api/transactions'
  private recurringBaseUrl = '/api/transactions/recurring'

  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    const params = new URLSearchParams()
    
    if (filters?.category) params.append('category', filters.category)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch transactions')
    }

    const data = await response.json()
    return data.transactions
  }

  async getTransaction(id: string): Promise<Transaction> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch transaction')
    }

    const data = await response.json()
    return data.transaction
  }

  async createTransaction(transactionData: CreateTransactionData): Promise<Transaction> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create transaction')
    }

    const data = await response.json()
    return data.transaction
  }

  async updateTransaction(id: string, updateData: UpdateTransactionData): Promise<Transaction> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update transaction')
    }

    const data = await response.json()
    return data.transaction
  }

  async deleteTransaction(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete transaction')
    }
  }

  // Recurring transaction methods
  async getRecurringTransactions(filters?: { type?: 'income' | 'expense'; category?: string }): Promise<Transaction[]> {
    const params = new URLSearchParams()
    
    if (filters?.type) params.append('type', filters.type)
    if (filters?.category) params.append('category', filters.category)

    const url = params.toString() ? `${this.recurringBaseUrl}?${params}` : this.recurringBaseUrl
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch recurring transactions')
    }

    const data = await response.json()
    return data.recurringTransactions
  }

  async generateMonthlyRecurringTransactions(): Promise<{ message: string; transactions: Transaction[] }> {
    const response = await fetch(this.recurringBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate recurring transactions')
    }

    return await response.json()
  }

  async updateRecurringTransaction(id: string, updateData: UpdateTransactionData): Promise<Transaction> {
    const response = await fetch(`${this.recurringBaseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update recurring transaction')
    }

    const data = await response.json()
    return data.transaction
  }

  async deleteRecurringTransaction(id: string, deleteInstances: boolean = false): Promise<void> {
    const response = await fetch(`${this.recurringBaseUrl}/${id}?deleteInstances=${deleteInstances}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete recurring transaction')
    }
  }

  async toggleRecurringTransaction(id: string): Promise<{ transaction: Transaction; isActive: boolean; message: string }> {
    const response = await fetch(`${this.recurringBaseUrl}/${id}/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to toggle recurring transaction')
    }

    return await response.json()
  }

  async getRecurringTransactionInstances(parentId: string): Promise<Transaction[]> {
    const response = await fetch(`${this.recurringBaseUrl}/${parentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch recurring transaction instances')
    }

    const data = await response.json()
    return data.instances
  }
}

export const transactionService = new TransactionService()