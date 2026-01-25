import { Transaction } from '@/lib/types/database'
import { CreateTransactionData, UpdateTransactionData } from './transactionService'

interface OfflineTransaction extends CreateTransactionData {
  id: string
  offline_id: string
  created_at: string
  synced: number // 0 for false, 1 for true
  action: 'create' | 'update' | 'delete'
  original_id?: string // For updates and deletes
}

interface OfflineUpdate {
  id: string
  transaction_id: string
  update_data: UpdateTransactionData
  created_at: string
  synced: number // 0 for false, 1 for true
}

interface OfflineDelete {
  id: string
  transaction_id: string
  created_at: string
  synced: number // 0 for false, 1 for true
}

class OfflineStorageService {
  private dbName = 'glance-money-offline'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store for offline transactions
        if (!db.objectStoreNames.contains('offline_transactions')) {
          const transactionStore = db.createObjectStore('offline_transactions', { keyPath: 'offline_id' })
          transactionStore.createIndex('synced', 'synced', { unique: false })
          transactionStore.createIndex('created_at', 'created_at', { unique: false })
        }

        // Store for cached transactions (for offline viewing)
        if (!db.objectStoreNames.contains('cached_transactions')) {
          const cachedStore = db.createObjectStore('cached_transactions', { keyPath: 'id' })
          cachedStore.createIndex('date', 'date', { unique: false })
          cachedStore.createIndex('category', 'category', { unique: false })
        }

        // Store for offline updates
        if (!db.objectStoreNames.contains('offline_updates')) {
          const updateStore = db.createObjectStore('offline_updates', { keyPath: 'id' })
          updateStore.createIndex('synced', 'synced', { unique: false })
          updateStore.createIndex('transaction_id', 'transaction_id', { unique: false })
        }

        // Store for offline deletes
        if (!db.objectStoreNames.contains('offline_deletes')) {
          const deleteStore = db.createObjectStore('offline_deletes', { keyPath: 'id' })
          deleteStore.createIndex('synced', 'synced', { unique: false })
          deleteStore.createIndex('transaction_id', 'transaction_id', { unique: false })
        }

        // Store for app metadata
        if (!db.objectStoreNames.contains('app_metadata')) {
          db.createObjectStore('app_metadata', { keyPath: 'key' })
        }
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB()
    }
    return this.db!
  }

  // Offline transaction operations
  async storeOfflineTransaction(transactionData: CreateTransactionData): Promise<string> {
    const db = await this.ensureDB()
    const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const offlineTransaction: OfflineTransaction = {
      ...transactionData,
      id: offlineId,
      offline_id: offlineId,
      created_at: new Date().toISOString(),
      synced: 0, // 0 for false
      action: 'create'
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_transactions'], 'readwrite')
      const store = transaction.objectStore('offline_transactions')
      const request = store.add(offlineTransaction)

      request.onsuccess = () => resolve(offlineId)
      request.onerror = () => reject(request.error)
    })
  }

  async storeOfflineUpdate(transactionId: string, updateData: UpdateTransactionData): Promise<string> {
    const db = await this.ensureDB()
    const updateId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const offlineUpdate: OfflineUpdate = {
      id: updateId,
      transaction_id: transactionId,
      update_data: updateData,
      created_at: new Date().toISOString(),
      synced: 0 // 0 for false
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_updates'], 'readwrite')
      const store = transaction.objectStore('offline_updates')
      const request = store.add(offlineUpdate)

      request.onsuccess = () => resolve(updateId)
      request.onerror = () => reject(request.error)
    })
  }

  async storeOfflineDelete(transactionId: string): Promise<string> {
    const db = await this.ensureDB()
    const deleteId = `delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const offlineDelete: OfflineDelete = {
      id: deleteId,
      transaction_id: transactionId,
      created_at: new Date().toISOString(),
      synced: 0 // 0 for false
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_deletes'], 'readwrite')
      const store = transaction.objectStore('offline_deletes')
      const request = store.add(offlineDelete)

      request.onsuccess = () => resolve(deleteId)
      request.onerror = () => reject(request.error)
    })
  }

  // Cache transactions for offline viewing
  async cacheTransactions(transactions: Transaction[]): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cached_transactions'], 'readwrite')
      const store = transaction.objectStore('cached_transactions')

      // Clear existing cache first
      const clearRequest = store.clear()
      clearRequest.onsuccess = () => {
        // Add new transactions
        let completed = 0
        const total = transactions.length

        if (total === 0) {
          resolve()
          return
        }

        transactions.forEach(txn => {
          const addRequest = store.add(txn)
          addRequest.onsuccess = () => {
            completed++
            if (completed === total) resolve()
          }
          addRequest.onerror = () => reject(addRequest.error)
        })
      }
      clearRequest.onerror = () => reject(clearRequest.error)
    })
  }

  async getCachedTransactions(): Promise<Transaction[]> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cached_transactions'], 'readonly')
      const store = transaction.objectStore('cached_transactions')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Get pending offline operations
  async getPendingTransactions(): Promise<OfflineTransaction[]> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_transactions'], 'readonly')
      const store = transaction.objectStore('offline_transactions')
      const index = store.index('synced')
      const request = index.getAll(IDBKeyRange.only(0)) // Use 0 for false, 1 for true

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingUpdates(): Promise<OfflineUpdate[]> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_updates'], 'readonly')
      const store = transaction.objectStore('offline_updates')
      const index = store.index('synced')
      const request = index.getAll(IDBKeyRange.only(0)) // Use 0 for false, 1 for true

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingDeletes(): Promise<OfflineDelete[]> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_deletes'], 'readonly')
      const store = transaction.objectStore('offline_deletes')
      const index = store.index('synced')
      const request = index.getAll(IDBKeyRange.only(0)) // Use 0 for false, 1 for true

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Mark operations as synced
  async markTransactionSynced(offlineId: string): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_transactions'], 'readwrite')
      const store = transaction.objectStore('offline_transactions')
      const getRequest = store.get(offlineId)

      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (record) {
          record.synced = 1 // 1 for true
          const putRequest = store.put(record)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async markUpdateSynced(updateId: string): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_updates'], 'readwrite')
      const store = transaction.objectStore('offline_updates')
      const getRequest = store.get(updateId)

      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (record) {
          record.synced = 1 // 1 for true
          const putRequest = store.put(record)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async markDeleteSynced(deleteId: string): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_deletes'], 'readwrite')
      const store = transaction.objectStore('offline_deletes')
      const getRequest = store.get(deleteId)

      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (record) {
          record.synced = 1 // 1 for true
          const putRequest = store.put(record)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // App metadata operations
  async setMetadata(key: string, value: any): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['app_metadata'], 'readwrite')
      const store = transaction.objectStore('app_metadata')
      const request = store.put({ key, value, updated_at: new Date().toISOString() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getMetadata(key: string): Promise<any> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['app_metadata'], 'readonly')
      const store = transaction.objectStore('app_metadata')
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result?.value || null)
      request.onerror = () => reject(request.error)
    })
  }

  // Cleanup synced operations
  async cleanupSyncedOperations(): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_transactions', 'offline_updates', 'offline_deletes'], 'readwrite')
      let completed = 0
      const total = 3

      const checkComplete = () => {
        completed++
        if (completed === total) resolve()
      }

      // Clean offline transactions
      const transactionStore = transaction.objectStore('offline_transactions')
      const transactionIndex = transactionStore.index('synced')
      const transactionRequest = transactionIndex.openCursor(IDBKeyRange.only(1)) // 1 for true
      transactionRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          checkComplete()
        }
      }
      transactionRequest.onerror = () => reject(transactionRequest.error)

      // Clean offline updates
      const updateStore = transaction.objectStore('offline_updates')
      const updateIndex = updateStore.index('synced')
      const updateRequest = updateIndex.openCursor(IDBKeyRange.only(1)) // 1 for true
      updateRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          checkComplete()
        }
      }
      updateRequest.onerror = () => reject(updateRequest.error)

      // Clean offline deletes
      const deleteStore = transaction.objectStore('offline_deletes')
      const deleteIndex = deleteStore.index('synced')
      const deleteRequest = deleteIndex.openCursor(IDBKeyRange.only(1)) // 1 for true
      deleteRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          checkComplete()
        }
      }
      deleteRequest.onerror = () => reject(deleteRequest.error)
    })
  }
}

export const offlineStorageService = new OfflineStorageService()