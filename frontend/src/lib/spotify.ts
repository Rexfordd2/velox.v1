import { supabase } from '@/lib/supabase'

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/auth/spotify/callback'
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private'
].join(' ')

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
  }
  duration_ms: number
  preview_url?: string
}

export interface SpotifyAudioFeatures {
  tempo: number // BPM
  energy: number // 0-1
  danceability: number // 0-1
  valence: number // 0-1 (musical positivity)
}

export interface SpotifyPlaybackState {
  is_playing: boolean
  progress_ms: number
  item: SpotifyTrack | null
}

export class SpotifyClient {
  private accessToken: string | null = null
  private tokenExpiresAt: number = 0
  private refreshToken: string | null = null

  constructor() {
    // Check for stored token
    if (typeof window !== 'undefined') {
      try {
        const storedToken = localStorage.getItem('spotify_access_token')
        const expiresAt = localStorage.getItem('spotify_token_expires_at')
        const storedRefresh = localStorage.getItem('spotify_refresh_token')
        if (storedToken && expiresAt) {
          const expiresAtNum = parseInt(expiresAt)
          if (expiresAtNum > Date.now()) {
            this.accessToken = storedToken
            this.tokenExpiresAt = expiresAtNum
          }
        }
        if (storedRefresh) this.refreshToken = storedRefresh
      } catch {}
    }
  }

  // PKCE helpers
  private async sha256(base: string) {
    const encoder = new TextEncoder()
    const data = encoder.encode(base)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return new Uint8Array(digest)
  }

  private base64UrlEncode(arrayBuffer: Uint8Array) {
    let str = ''
    for (let i = 0; i < arrayBuffer.byteLength; i++) {
      str += String.fromCharCode(arrayBuffer[i])
    }
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  private generateRandomString(length = 64) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const values = crypto.getRandomValues(new Uint32Array(length))
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length]
    }
    return result
  }

  // Start auth by generating PKCE and returning the URL
  async startAuth(returnTo?: string): Promise<string> {
    const state = this.generateRandomString(16)
    const verifier = this.generateRandomString(64)
    const challenge = this.base64UrlEncode(await this.sha256(verifier))
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('spotify_pkce_verifier', verifier)
      sessionStorage.setItem('spotify_oauth_state', state)
      if (returnTo) sessionStorage.setItem('spotify_return_to', returnTo)
    }
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state
    })
    return `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  // Exchange code for tokens (PKCE)
  async exchangeCodeForTokens(fullUrl: string): Promise<boolean> {
    const url = new URL(fullUrl)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const storedState = typeof window !== 'undefined' ? sessionStorage.getItem('spotify_oauth_state') : null
    const verifier = typeof window !== 'undefined' ? sessionStorage.getItem('spotify_pkce_verifier') : null
    if (!code || !verifier || !state || state !== storedState) return false
    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: verifier
      })
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      })
      if (!res.ok) return false
      const data = await res.json()
      if (!data.access_token) return false
      this.setTokens(data.access_token, data.expires_in, data.refresh_token)
      await this.persistRefreshToken(data.refresh_token)
      return true
    } catch (e) {
      console.error('Spotify token exchange failed', e)
      return false
    }
  }

  private setTokens(accessToken: string, expiresInSec: number, refreshToken?: string) {
    this.accessToken = accessToken
    this.tokenExpiresAt = Date.now() + expiresInSec * 1000 - 30_000 // 30s early
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('spotify_access_token', accessToken)
        localStorage.setItem('spotify_token_expires_at', this.tokenExpiresAt.toString())
        if (refreshToken) {
          this.refreshToken = refreshToken
          localStorage.setItem('spotify_refresh_token', refreshToken)
        }
      } catch {}
    }
  }

  private async persistRefreshToken(refreshToken?: string | null) {
    const rt = refreshToken ?? this.refreshToken
    if (!rt) return
    try {
      if (supabase) {
        await supabase.auth.updateUser({ data: { spotify_refresh: rt } })
      }
    } catch (e) {
      console.warn('Failed to persist refresh token to Supabase metadata', e)
    }
  }

  private async tryLoadRefreshFromSupabase(): Promise<string | null> {
    try {
      if (!supabase) return this.refreshToken
      const { data: session } = await supabase.auth.getSession()
      const rt = (session.session?.user?.user_metadata as any)?.spotify_refresh as string | undefined
      if (rt) {
        this.refreshToken = rt
        localStorage.setItem('spotify_refresh_token', rt)
        return rt
      }
    } catch {}
    return this.refreshToken
  }

  private async ensureAccessToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiresAt > Date.now()) return
    // try refresh
    const refresh = this.refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('spotify_refresh_token') : null) || await this.tryLoadRefreshFromSupabase()
    if (!refresh) throw new Error('Not authenticated with Spotify')
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh,
      client_id: SPOTIFY_CLIENT_ID
    })
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    if (!res.ok) throw new Error('Failed to refresh Spotify token')
    const data = await res.json()
    this.setTokens(data.access_token, data.expires_in, data.refresh_token)
    if (data.refresh_token) await this.persistRefreshToken(data.refresh_token)
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.accessToken !== null && this.tokenExpiresAt > Date.now()
  }

  // Logout
  logout(): void {
    this.accessToken = null
    this.tokenExpiresAt = 0
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('spotify_access_token')
        localStorage.removeItem('spotify_token_expires_at')
      } catch {}
    }
  }

  // Make authenticated request
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    await this.ensureAccessToken()
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Try one immediate refresh and retry once
        await this.ensureAccessToken()
        const retry = await fetch(`https://api.spotify.com/v1${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        })
        if (!retry.ok) throw new Error(`Spotify API error: ${retry.status}`)
        return retry.status === 204 ? null : retry.json()
      }
      throw new Error(`Spotify API error: ${response.status}`)
    }

    return response.status === 204 ? null : response.json()
  }

  // Get current playback state
  async getCurrentPlayback(): Promise<SpotifyPlaybackState | null> {
    try {
      const data = await this.request('/me/player')
      return data
    } catch (error) {
      console.error('Error getting playback state:', error)
      return null
    }
  }

  // Get audio features for a track (includes BPM)
  async getAudioFeatures(trackId: string): Promise<SpotifyAudioFeatures | null> {
    try {
      const data = await this.request(`/audio-features/${trackId}`)
      return data
    } catch (error) {
      console.error('Error getting audio features:', error)
      return null
    }
  }

  // Get recently played tracks
  async getRecentlyPlayed(limit: number = 10): Promise<SpotifyTrack[]> {
    try {
      const data = await this.request(`/me/player/recently-played?limit=${limit}`)
      return data.items.map((item: any) => item.track)
    } catch (error) {
      console.error('Error getting recently played:', error)
      return []
    }
  }

  // Search for tracks
  async searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
    try {
      const data = await this.request(`/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`)
      return data.tracks.items
    } catch (error) {
      console.error('Error searching tracks:', error)
      return []
    }
  }

  // Get recommended workout tracks based on BPM
  async getWorkoutTracks(targetBPM: number, tolerance: number = 10): Promise<SpotifyTrack[]> {
    try {
      // Search for popular workout tracks
      const workoutGenres = ['workout', 'gym', 'fitness', 'running', 'cardio']
      const tracks: SpotifyTrack[] = []
      
      for (const genre of workoutGenres) {
        const results = await this.searchTracks(genre, 5)
        tracks.push(...results)
      }

      // Filter by BPM if we have audio features
      const tracksWithBPM = await Promise.all(
        tracks.map(async (track) => {
          const features = await this.getAudioFeatures(track.id)
          return { track, features }
        })
      )

      return tracksWithBPM
        .filter(({ features }) => 
          features && 
          features.tempo >= targetBPM - tolerance && 
          features.tempo <= targetBPM + tolerance
        )
        .sort((a, b) => (b.features?.energy || 0) - (a.features?.energy || 0))
        .map(({ track }) => track)
    } catch (error) {
      console.error('Error getting workout tracks:', error)
      return []
    }
  }

  // Playback controls
  async play(uri?: string, positionMs?: number, deviceId?: string): Promise<void> {
    const body: any = {}
    if (uri) body.uris = [uri]
    if (typeof positionMs === 'number') body.position_ms = positionMs
    const qp = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : ''
    await this.request(`/me/player/play${qp}`, { method: 'PUT', body: JSON.stringify(body) })
  }

  async pause(deviceId?: string): Promise<void> {
    const qp = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : ''
    await this.request(`/me/player/pause${qp}`, { method: 'PUT' })
  }

  async setVolume(volume01: number, deviceId?: string): Promise<void> {
    const vol = Math.max(0, Math.min(1, volume01)) * 100
    const qp = new URLSearchParams({ volume_percent: String(Math.round(vol)) })
    const suffix = deviceId ? `&device_id=${encodeURIComponent(deviceId)}` : ''
    await this.request(`/me/player/volume?${qp.toString()}${suffix}`, { method: 'PUT' })
  }

  async seek(positionMs: number, deviceId?: string): Promise<void> {
    const qp = new URLSearchParams({ position_ms: String(Math.max(0, Math.floor(positionMs))) })
    const suffix = deviceId ? `&device_id=${encodeURIComponent(deviceId)}` : ''
    await this.request(`/me/player/seek?${qp.toString()}${suffix}`, { method: 'PUT' })
  }
}

// Singleton instance
export const spotifyClient = new SpotifyClient() 