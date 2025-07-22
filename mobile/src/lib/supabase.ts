import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Network from 'expo-network'
import { PostgrestResponse, PostgrestSingleResponse, PostgrestError } from '@supabase/postgrest-js'

// Offline queue storage key
const OFFLINE_QUEUE_KEY = 'OFFLINE_QUEUE'

// Interface for offline operations
interface OfflineOperation {
  id: string
  table: string
  operation: 'insert' | 'update' | 'delete'
  data: any
  timestamp: number
}

interface DbResponse<T> {
  data: T | null
  error: PostgrestError | Error | null
  offline?: boolean
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key)
  },
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-app-version': process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    },
  },
})

// Offline queue management
export const offlineManager = {
  async addToQueue(operation: Omit<OfflineOperation, 'id' | 'timestamp'>) {
    try {
      const queue = await this.getQueue()
      const newOperation: OfflineOperation = {
        ...operation,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
      }
      queue.push(newOperation)
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
    } catch (error) {
      console.error('Error adding to offline queue:', error)
    }
  },

  async getQueue(): Promise<OfflineOperation[]> {
    try {
      const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
      return queue ? JSON.parse(queue) : []
    } catch (error) {
      console.error('Error getting offline queue:', error)
      return []
    }
  },

  async processQueue() {
    const networkState = await Network.getNetworkStateAsync()
    if (!networkState.isConnected || !networkState.isInternetReachable) return

    const queue = await this.getQueue()
    const failedOperations: OfflineOperation[] = []

    for (const op of queue) {
      try {
        switch (op.operation) {
          case 'insert':
            await supabase.from(op.table).insert(op.data)
            break
          case 'update':
            await supabase.from(op.table).update(op.data).eq('id', op.data.id)
            break
          case 'delete':
            await supabase.from(op.table).delete().eq('id', op.data.id)
            break
        }
      } catch (error) {
        console.error(`Failed to process operation ${op.id}:`, error)
        failedOperations.push(op)
      }
    }

    // Update queue with only failed operations
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedOperations))
  },
}

// Enhanced error handling wrapper
export const withErrorHandling = async <T extends object>(
  operation: () => Promise<PostgrestResponse<T>>,
  retries = 3,
  retryDelay = 1000
): Promise<PostgrestResponse<T>> => {
  let lastError: any
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await operation()
      return result
    } catch (error: any) {
      lastError = error
      
      // Check if we should retry based on error type
      if (error?.status === 429 || error?.message?.includes('network')) {
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
          continue
        }
      }
      
      // Don't retry for auth errors or validation errors
      if (error?.status === 401 || error?.status === 403 || error?.status === 422) {
        throw error
      }
    }
  }
  
  throw lastError
}

// Network state monitoring and queue processing
let networkMonitoringStarted = false

export const startNetworkMonitoring = async () => {
  if (networkMonitoringStarted) return

  networkMonitoringStarted = true
  
  // Initial queue processing
  const networkState = await Network.getNetworkStateAsync()
  if (networkState.isConnected && networkState.isInternetReachable) {
    await offlineManager.processQueue()
  }

  // Set up periodic queue processing
  setInterval(async () => {
    const networkState = await Network.getNetworkStateAsync()
    if (networkState.isConnected && networkState.isInternetReachable) {
      await offlineManager.processQueue()
    }
  }, 30000) // Check every 30 seconds
}

// Export enhanced database operations
export const db = {
  insert: async <T extends object>(table: string, data: T): Promise<DbResponse<T>> => {
    try {
      const networkState = await Network.getNetworkStateAsync()
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        await offlineManager.addToQueue({
          table,
          operation: 'insert',
          data,
        })
        return { data: null, error: null, offline: true }
      }

      const { data: responseData, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single()

      return {
        data: responseData as T,
        error: error as PostgrestError | null,
      }
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error)
      return { data: null, error: error as Error }
    }
  },

  update: async <T extends object>(table: string, data: T, id: string): Promise<DbResponse<T>> => {
    try {
      const networkState = await Network.getNetworkStateAsync()
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        await offlineManager.addToQueue({
          table,
          operation: 'update',
          data: { ...data, id },
        })
        return { data: null, error: null, offline: true }
      }

      const { data: responseData, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      return {
        data: responseData as T,
        error: error as PostgrestError | null,
      }
    } catch (error) {
      console.error(`Error updating ${table}:`, error)
      return { data: null, error: error as Error }
    }
  },

  delete: async (table: string, id: string): Promise<DbResponse<null>> => {
    try {
      const networkState = await Network.getNetworkStateAsync()
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        await offlineManager.addToQueue({
          table,
          operation: 'delete',
          data: { id },
        })
        return { data: null, error: null, offline: true }
      }

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      return {
        data: null,
        error: error as PostgrestError | null,
      }
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error)
      return { data: null, error: error as Error }
    }
  },
} 