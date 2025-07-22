import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { withErrorHandling } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SESSION_REFRESH_THRESHOLD = 10 * 60 * 1000 // 10 minutes in milliseconds
const SESSION_KEY = 'LAST_SESSION_REFRESH'

export type AuthErrorType = {
  code: string
  message: string
  status?: number
}

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthErrorType | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
  sendVerificationEmail: () => Promise<void>
  isEmailVerified: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  refreshSession: async () => {},
  clearError: () => {},
  sendVerificationEmail: async () => {},
  isEmailVerified: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthErrorType | null>(null)
  const [isEmailVerified, setIsEmailVerified] = useState(false)

  const handleError = (error: AuthError | Error | any) => {
    const authError: AuthErrorType = {
      code: error.code || 'unknown_error',
      message: error.message || 'An unknown error occurred',
      status: error.status
    }
    setError(authError)
    throw error // Re-throw for component-level handling if needed
  }

  const clearError = () => setError(null)

  const checkSessionRefresh = async () => {
    try {
      const lastRefresh = await AsyncStorage.getItem(SESSION_KEY)
      const now = Date.now()
      
      if (!lastRefresh || now - parseInt(lastRefresh) > SESSION_REFRESH_THRESHOLD) {
        await refreshSession()
        await AsyncStorage.setItem(SESSION_KEY, now.toString())
      }
    } catch (error) {
      console.error('Error checking session refresh:', error)
    }
  }

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsEmailVerified(session?.user?.email_confirmed_at != null)
      setLoading(false)
    })

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsEmailVerified(session?.user?.email_confirmed_at != null)
      setLoading(false)

      if (session) {
        await checkSessionRefresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await withErrorHandling(async () => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      })
    } catch (error) {
      handleError(error)
    }
  }

  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      await withErrorHandling(async () => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
            emailRedirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL,
          }
        })
        if (error) throw error
      })
    } catch (error) {
      handleError(error)
    }
  }

  const signOut = async () => {
    try {
      await withErrorHandling(async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        await AsyncStorage.removeItem(SESSION_KEY)
      })
    } catch (error) {
      handleError(error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await withErrorHandling(async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL,
        })
        if (error) throw error
      })
    } catch (error) {
      handleError(error)
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      await withErrorHandling(async () => {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        })
        if (error) throw error
      })
    } catch (error) {
      handleError(error)
    }
  }

  const refreshSession = async () => {
    try {
      await withErrorHandling(async () => {
        const { error } = await supabase.auth.refreshSession()
        if (error) throw error
      })
    } catch (error) {
      handleError(error)
    }
  }

  const sendVerificationEmail = async () => {
    try {
      await withErrorHandling(async () => {
        if (!user?.email) throw new Error('No email address available')
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email,
        })
        if (error) throw error
      })
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        loading, 
        error,
        signIn, 
        signUp, 
        signOut,
        resetPassword,
        updatePassword,
        refreshSession,
        clearError,
        sendVerificationEmail,
        isEmailVerified
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 