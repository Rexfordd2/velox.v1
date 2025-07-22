'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { spotifyClient } from '@/lib/spotify'

export default function SpotifyCallback() {
  const router = useRouter()

  useEffect(() => {
    // Get the hash from the URL
    const hash = window.location.hash
    
    if (hash) {
      const success = spotifyClient.handleCallback(hash)
      
      if (success) {
        // Redirect to game mode or previous page
        const returnTo = sessionStorage.getItem('spotify_return_to') || '/game'
        sessionStorage.removeItem('spotify_return_to')
        router.push(returnTo)
      } else {
        router.push('/game?error=spotify_auth_failed')
      }
    } else {
      router.push('/game?error=no_spotify_token')
    }
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