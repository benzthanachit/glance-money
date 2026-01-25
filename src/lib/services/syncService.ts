import { offlineStorageService } from './offlineStorageService'
import { transactionService } from './transactionService'

interface SyncResult {
  success: boolean
  syncedTransactions: number
  syncedUpdates: number
  syncedDeletes: number
  errors: string[]
}

class SyncService {
  private isSyncing = false
  private syncListeners: ((result: SyncResult) => void)[] = []

  async syncOfflineData(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress')
    }

    this.isSyncing = true
    const result: SyncResult = {
      success: true,
      syncedTransactions: 0,
      syncedUpdates: 0,
      syncedDeletes: 0,
      errors: []
    }

    try {
      // Initialize offline storage
      await offlineStorageService.initDB()

      // Sync offline transactions first
      await this.syncOfflineTransactions(result)

      // Then sync updates
      await this.syncOfflineUpdates(result)

      // Finally sync deletes
      await this.syncOfflineDeletes(result)

      // Clean up synced operations
      await offlineStorageService.cleanupSyncedOperations()

      // Update last sync time
      await offlineStorageService.setMetadata('lastSyncTime', new Date().toISOString())

      result.success = result.errors.length === 0

    } catch (error) {
      result.success = false
      result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      this.isSyncing = false
    }

    // Notify listeners
    this.syncListeners.forEach(listener => listener(result))

    return result
  }

  private async syncOfflineTransactions(result: SyncResult): Promise<void> {
    try {
      const pendingTransactions = await offlineStorageService.getPendingTransactions()
      
      for (const offlineTransaction of pendingTransactions) {
        try {
          // Create the transaction on the server
          const createdTransaction = await transactionService.createTransaction({
            amount: offlineTransaction.amount,
            type: offlineTransaction.type,
            category: offlineTransaction.category,
            description: offlineTransaction.description,
            date: offlineTransaction.date,
            is_recurring: offlineTransaction.is_recurring
          })

          // Mark as synced
          await offlineStorageService.markTransactionSynced(offlineTransaction.offline_id)
          result.syncedTransactions++

        } catch (error) {
          result.errors.push(`Failed to sync transaction ${offlineTransaction.offline_id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } catch (error) {
      result.errors.push(`Failed to get pending transactions: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async syncOfflineUpdates(result: SyncResult): Promise<void> {
    try {
      const pendingUpdates = await offlineStorageService.getPendingUpdates()
      
      for (const offlineUpdate of pendingUpdates) {
        try {
          // Update the transaction on the server
          await transactionService.updateTransaction(
            offlineUpdate.transaction_id,
            offlineUpdate.update_data
          )

          // Mark as synced
          await offlineStorageService.markUpdateSynced(offlineUpdate.id)
          result.syncedUpdates++

        } catch (error) {
          result.errors.push(`Failed to sync update ${offlineUpdate.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } catch (error) {
      result.errors.push(`Failed to get pending updates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async syncOfflineDeletes(result: SyncResult): Promise<void> {
    try {
      const pendingDeletes = await offlineStorageService.getPendingDeletes()
      
      for (const offlineDelete of pendingDeletes) {
        try {
          // Delete the transaction on the server
          await transactionService.deleteTransaction(offlineDelete.transaction_id)

          // Mark as synced
          await offlineStorageService.markDeleteSynced(offlineDelete.id)
          result.syncedDeletes++

        } catch (error) {
          result.errors.push(`Failed to sync delete ${offlineDelete.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } catch (error) {
      result.errors.push(`Failed to get pending deletes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async hasPendingOperations(): Promise<boolean> {
    try {
      await offlineStorageService.initDB()
      
      const [pendingTransactions, pendingUpdates, pendingDeletes] = await Promise.all([
        offlineStorageService.getPendingTransactions(),
        offlineStorageService.getPendingUpdates(),
        offlineStorageService.getPendingDeletes()
      ])

      return pendingTransactions.length > 0 || pendingUpdates.length > 0 || pendingDeletes.length > 0
    } catch (error) {
      console.error('Failed to check pending operations:', error)
      return false
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    try {
      await offlineStorageService.initDB()
      const lastSyncTime = await offlineStorageService.getMetadata('lastSyncTime')
      return lastSyncTime ? new Date(lastSyncTime) : null
    } catch (error) {
      console.error('Failed to get last sync time:', error)
      return null
    }
  }

  onSyncComplete(listener: (result: SyncResult) => void): () => void {
    this.syncListeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(listener)
      if (index > -1) {
        this.syncListeners.splice(index, 1)
      }
    }
  }

  get isCurrentlySyncing(): boolean {
    return this.isSyncing
  }
}

export const syncService = new SyncService()