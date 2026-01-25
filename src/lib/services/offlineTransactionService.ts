import { Transaction } from '@/lib/types/database'
import { transactionService, CreateTransactionData, UpdateTransactionData, TransactionFilters } from './transactionService'
import { offlineStorageService } from './offlineStorageService'
import { syncService } from './syncService'

class OfflineTransactionService {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))
    }
  }

  private handleOnline(): void {
    this.isOnline = true
    // Automatically sync when coming back online
    this.syncWhenOnline()
  }

  private handleOffline(): void {
    this.isOnline = false
  }

  private async syncWhenOnline(): Promise<void> {
    try {
      const hasPending = await syncService.hasPendingOperations()
      if (hasPending) {
        await syncService.syncOfflineData()
      }
    } catch (error) {
      console.error('Auto-sync failed:', error)
    }
  }

  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    try {
      if (this.isOnline) {
        // Try to get from server first
        const transactions = await transactionService.getTransactions(filters)
        
        // Cache the transactions for offline use
        await offlineStorageService.initDB()
        await offlineStorageService.cacheTransactions(transactions)
        
        return transactions
      } else {
        // Return cached transactions when offline
        await offlineStorageService.initDB()
        const cachedTransactions = await offlineStorageService.getCachedTransactions()
        
        // Apply filters to cached data
        return this.applyFiltersToTransactions(cachedTransactions, filters)
      }
    } catch (error) {
      // Fallback to cached data if server request fails
      try {
        await offlineStorageService.initDB()
        const cachedTransactions = await offlineStorageService.getCachedTransactions()
        return this.applyFiltersToTransactions(cachedTransactions, filters)
      } catch (cacheError) {
        throw new Error(`Failed to get transactions: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  private applyFiltersToTransactions(transactions: Transaction[], filters?: TransactionFilters): Transaction[] {
    let filtered = [...transactions]

    if (filters?.category) {
      filtered = filtered.filter(t => t.category === filters.category)
    }

    if (filters?.startDate) {
      const startDate = new Date(filters.startDate)
      filtered = filtered.filter(t => new Date(t.date) >= startDate)
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate)
      filtered = filtered.filter(t => new Date(t.date) <= endDate)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    return filtered
  }

  async getTransaction(id: string): Promise<Transaction> {
    try {
      if (this.isOnline) {
        return await transactionService.getTransaction(id)
      } else {
        // Try to get from cache
        await offlineStorageService.initDB()
        const cachedTransactions = await offlineStorageService.getCachedTransactions()
        const transaction = cachedTransactions.find(t => t.id === id)
        
        if (!transaction) {
          throw new Error('Transaction not found in offline cache')
        }
        
        return transaction
      }
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async createTransaction(transactionData: CreateTransactionData): Promise<Transaction> {
    try {
      if (this.isOnline) {
        // Try to create on server first
        const transaction = await transactionService.createTransaction(transactionData)
        
        // Update cache
        await this.updateCache()
        
        return transaction
      } else {
        // Store offline for later sync
        await offlineStorageService.initDB()
        const offlineId = await offlineStorageService.storeOfflineTransaction(transactionData)
        
        // Create a temporary transaction object for immediate UI feedback
        const tempTransaction: Transaction = {
          id: offlineId,
          user_id: 'offline-user',
          amount: transactionData.amount,
          type: transactionData.type,
          category: transactionData.category,
          description: transactionData.description || null,
          date: transactionData.date || new Date().toISOString().split('T')[0],
          is_recurring: transactionData.is_recurring || false,
          recurring_parent_id: transactionData.recurring_parent_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Add to cache for immediate display
        const cachedTransactions = await offlineStorageService.getCachedTransactions()
        cachedTransactions.unshift(tempTransaction)
        await offlineStorageService.cacheTransactions(cachedTransactions)
        
        return tempTransaction
      }
    } catch (error) {
      if (this.isOnline) {
        // If online request fails, fall back to offline storage
        await offlineStorageService.initDB()
        const offlineId = await offlineStorageService.storeOfflineTransaction(transactionData)
        
        const tempTransaction: Transaction = {
          id: offlineId,
          user_id: 'offline-user',
          amount: transactionData.amount,
          type: transactionData.type,
          category: transactionData.category,
          description: transactionData.description || null,
          date: transactionData.date || new Date().toISOString().split('T')[0],
          is_recurring: transactionData.is_recurring || false,
          recurring_parent_id: transactionData.recurring_parent_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        return tempTransaction
      }
      
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateTransaction(id: string, updateData: UpdateTransactionData): Promise<Transaction> {
    try {
      if (this.isOnline) {
        // Try to update on server first
        const transaction = await transactionService.updateTransaction(id, updateData)
        
        // Update cache
        await this.updateCache()
        
        return transaction
      } else {
        // Store offline update for later sync
        await offlineStorageService.initDB()
        await offlineStorageService.storeOfflineUpdate(id, updateData)
        
        // Update cached transaction for immediate UI feedback
        const cachedTransactions = await offlineStorageService.getCachedTransactions()
        const transactionIndex = cachedTransactions.findIndex(t => t.id === id)
        
        if (transactionIndex === -1) {
          throw new Error('Transaction not found in offline cache')
        }
        
        const updatedTransaction = {
          ...cachedTransactions[transactionIndex],
          ...updateData,
          updated_at: new Date().toISOString()
        }
        
        cachedTransactions[transactionIndex] = updatedTransaction
        await offlineStorageService.cacheTransactions(cachedTransactions)
        
        return updatedTransaction
      }
    } catch (error) {
      if (this.isOnline) {
        // If online request fails, fall back to offline storage
        await offlineStorageService.initDB()
        await offlineStorageService.storeOfflineUpdate(id, updateData)
        
        // Try to update cache
        const cachedTransactions = await offlineStorageService.getCachedTransactions()
        const transactionIndex = cachedTransactions.findIndex(t => t.id === id)
        
        if (transactionIndex >= 0) {
          const updatedTransaction = {
            ...cachedTransactions[transactionIndex],
            ...updateData,
            updated_at: new Date().toISOString()
          }
          
          cachedTransactions[transactionIndex] = updatedTransaction
          await offlineStorageService.cacheTransactions(cachedTransactions)
          
          return updatedTransaction
        }
      }
      
      throw new Error(`Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      if (this.isOnline) {
        // Try to delete on server first
        await transactionService.deleteTransaction(id)
        
        // Update cache
        await this.updateCache()
      } else {
        // Store offline delete for later sync
        await offlineStorageService.initDB()
        await offlineStorageService.storeOfflineDelete(id)
        
        // Remove from cache for immediate UI feedback
        const cachedTransactions = await offlineStorageService.getCachedTransactions()
        const filteredTransactions = cachedTransactions.filter(t => t.id !== id)
        await offlineStorageService.cacheTransactions(filteredTransactions)
      }
    } catch (error) {
      if (this.isOnline) {
        // If online request fails, fall back to offline storage
        await offlineStorageService.initDB()
        await offlineStorageService.storeOfflineDelete(id)
        
        // Try to remove from cache
        const cachedTransactions = await offlineStorageService.getCachedTransactions()
        const filteredTransactions = cachedTransactions.filter(t => t.id !== id)
        await offlineStorageService.cacheTransactions(filteredTransactions)
      } else {
        throw new Error(`Failed to delete transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  private async updateCache(): Promise<void> {
    try {
      const transactions = await transactionService.getTransactions()
      await offlineStorageService.initDB()
      await offlineStorageService.cacheTransactions(transactions)
    } catch (error) {
      console.error('Failed to update cache:', error)
    }
  }

  async syncOfflineData(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }
    
    await syncService.syncOfflineData()
    
    // Refresh cache after sync
    await this.updateCache()
  }

  async hasPendingOperations(): Promise<boolean> {
    return await syncService.hasPendingOperations()
  }

  get connectionStatus(): 'online' | 'offline' {
    return this.isOnline ? 'online' : 'offline'
  }

  onSyncComplete(listener: (result: any) => void): () => void {
    return syncService.onSyncComplete(listener)
  }
}

export const offlineTransactionService = new OfflineTransactionService()