'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { spotifyClient } from '@/lib/spotify'
import { toast } from 'sonner'

export default function SpotifyCallback() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const ok = await spotifyClient.exchangeCodeForTokens(window.location.href)
      const returnTo = sessionStorage.getItem('spotify_return_to') || '/game'
      sessionStorage.removeItem('spotify_return_to')
      if (ok) {
        try { toast?.success?.('Spotify connected') } catch {}
        router.replace(returnTo)
      } else {
        try { toast?.error?.('Spotify authentication failed') } catch {}
        router.replace(returnTo + '?error=spotify_auth_failed')
      }
    }
    run()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Connecting to Spotify...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
      </div>
    </div>
  )
} 