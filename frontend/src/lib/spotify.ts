const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/auth/spotify/callback'
const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-recently-played',
  'streaming',
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

  constructor() {
    // Check for stored token
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('spotify_access_token')
      const expiresAt = localStorage.getItem('spotify_token_expires_at')
      
      if (storedToken && expiresAt) {
        const expiresAtNum = parseInt(expiresAt)
        if (expiresAtNum > Date.now()) {
          this.accessToken = storedToken
          this.tokenExpiresAt = expiresAtNum
        }
      }
    }
  }

  // Generate the Spotify authorization URL
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'token',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      show_dialog: 'false'
    })

    return `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  // Handle the callback from Spotify
  handleCallback(hash: string): boolean {
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const expiresIn = params.get('expires_in')

    if (accessToken && expiresIn) {
      this.accessToken = accessToken
      this.tokenExpiresAt = Date.now() + parseInt(expiresIn) * 1000

      // Store in localStorage
      localStorage.setItem('spotify_access_token', accessToken)
      localStorage.setItem('spotify_token_expires_at', this.tokenExpiresAt.toString())

      return true
    }

    return false
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.accessToken !== null && this.tokenExpiresAt > Date.now()
  }

  // Logout
  logout(): void {
    this.accessToken = null
    this.tokenExpiresAt = 0
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_token_expires_at')
  }

  // Make authenticated request
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Spotify')
    }

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
        this.logout()
        throw new Error('Spotify authentication expired')
      }
      throw new Error(`Spotify API error: ${response.status}`)
    }

    return response.json()
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
}

// Singleton instance
export const spotifyClient = new SpotifyClient() 