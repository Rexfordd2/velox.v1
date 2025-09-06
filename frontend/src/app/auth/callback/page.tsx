'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange the code for a session
        if (!supabase) {
          router.push('/auth/signin?error=unconfigured')
          return
        }
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        
        if (error) {
          console.error('Error during auth callback:', error)
          router.push('/auth/signin?error=callback')
          return
        }

        // Successful authentication - redirect to dashboard
        router.push('/dashboard')
      } catch (error) {
        console.error('Unexpected error during auth callback:', error)
        router.push('/auth/signin?error=callback')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Verifying your account...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
      </div>
    </div>
  )
} 