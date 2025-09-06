import { MusicSource, PlaybackControls, TrackSummary } from '../index';

type CurrentTrack = {
  item?: { id: string; name: string; artists?: { name: string }[] } | null;
  progress_ms?: number;
  is_playing?: boolean;
};

type AudioFeatures = { tempo?: number } & Record<string, any>;

const API = 'https://api.spotify.com/v1';
const ACCOUNTS = 'https://accounts.spotify.com/api';

// Minimal stubs for Spotify auth/search/playback. Implementation TBD.

export interface SpotifyAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes?: string[];
}

export function createSpotifyAuth(config: SpotifyAuthConfig) {
  let accessToken: string | null = null;
  let expiresAt = 0;
  let refreshToken: string | null = null;

  async function refreshIfNeeded() {
    if (accessToken && Date.now() < expiresAt - 30000) return;
    if (!refreshToken) throw new Error('No Spotify refresh token');
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
    });
    const res = await fetch(`${ACCOUNTS}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) throw new Error('Spotify refresh failed');
    const json = await res.json();
    accessToken = json.access_token;
    if (json.refresh_token) refreshToken = json.refresh_token;
    expiresAt = Date.now() + (json.expires_in ?? 3600) * 1000;
  }

  return {
    login: async (): Promise<void> => {
      void config; // handled by app; this stub keeps types consistent
    },
    logout: async (): Promise<void> => {
      accessToken = null; refreshToken = null; expiresAt = 0;
    },
    getAccessToken: async (): Promise<string | null> => {
      try { await refreshIfNeeded(); } catch { return null; }
      return accessToken;
    },
    // Expose a way for host app to inject tokens after web/mobile OAuth
    __setTokens(at: string, rt?: string, expiresInSec: number = 3600) {
      accessToken = at; if (rt) refreshToken = rt; expiresAt = Date.now() + expiresInSec * 1000;
    }
  } as any;
}

class SpotifyPlayback implements PlaybackControls {
  private token: string;
  private deviceId?: string;
  private uri?: string;
  constructor(token: string, deviceId?: string, uri?: string) {
    this.token = token; this.deviceId = deviceId; this.uri = uri;
  }
  private async req(path: string, init: RequestInit = {}) {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
    if (!res.ok) throw new Error(`Spotify error ${res.status}`);
    return res.status === 204 ? null : res.json();
  }
  async play(): Promise<void> { await this.req(`/me/player/play${this.deviceId ? `?device_id=${this.deviceId}` : ''}`, { method: 'PUT', body: this.uri ? JSON.stringify({ uris: [this.uri] }) : undefined }); }
  async pause(): Promise<void> { await this.req(`/me/player/pause${this.deviceId ? `?device_id=${this.deviceId}` : ''}`, { method: 'PUT' }); }
  async seek(ms: number): Promise<void> { await this.req(`/me/player/seek?position_ms=${Math.max(0, Math.floor(ms))}${this.deviceId ? `&device_id=${this.deviceId}` : ''}`, { method: 'PUT' }); }
  async getPositionMs(): Promise<number> { const s: CurrentTrack = await this.req('/me/player'); return s?.progress_ms ?? 0; }
  async getDurationMs(): Promise<number | null> { const s: CurrentTrack = await this.req('/me/player'); return s?.item ? (s as any).item.duration_ms ?? null : null; }
}

export const spotifySource: MusicSource = {
  id: 'spotify',
  label: 'Spotify',
  async listByTempo(bpm: number): Promise<TrackSummary[]> {
    // Placeholder: host app should call recommendations and map
    return [{ id: `tempo:${bpm}`, title: 'Tempo Match', artist: 'Various', bpm, energy: 0.6, vibes: ['groove'] }];
  },
  async loadById(id: string) {
    // Expect the host to provide a bearer token via environment or injected context
    const token = (globalThis as any).SPOTIFY_BEARER as string | undefined;
    if (!token) throw new Error('Missing SPOTIFY_BEARER for spotifySource');
    // Get current track if id is 'current', else use provided id as uri
    let meta: TrackSummary = { id, title: 'Unknown', artist: 'Unknown', bpm: 120, energy: 0.5 };
    if (id === 'current') {
      const s = await fetch(`${API}/me/player`, { headers: { Authorization: `Bearer ${token}` } });
      if (s.ok) {
        const j: CurrentTrack = await s.json();
        if (j?.item?.id) meta = { id: j.item.id, title: j.item.name, artist: (j.item.artists?.[0]?.name) ?? 'Unknown', bpm: 120, energy: 0.5 };
      }
    }
    // fetch audio features for BPM seed
    try {
      const afRes = await fetch(`${API}/audio-features/${meta.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (afRes.ok) {
        const af: AudioFeatures = await afRes.json();
        if (af?.tempo) meta.bpm = Math.round(af.tempo);
      }
    } catch {}
    const controls = new SpotifyPlayback(token, undefined, id.startsWith('spotify:') ? id : undefined);
    return { controls, bpm: meta.bpm, meta };
  },
};

export async function getCurrentTrack(token: string): Promise<CurrentTrack | null> {
  const res = await fetch(`${API}/me/player/currently-playing`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  return res.status === 204 ? null : (await res.json());
}

export async function getAudioFeatures(token: string, trackId: string): Promise<AudioFeatures | null> {
  const res = await fetch(`${API}/audio-features/${trackId}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  return await res.json();
}

export async function startPlayback(token: string, deviceId: string, uri: string, positionMs?: number) {
  const body: any = { uris: [uri] };
  if (typeof positionMs === 'number') body.position_ms = positionMs;
  await fetch(`${API}/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function transferPlayback(token: string, deviceId: string) {
  await fetch(`${API}/me/player`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  });
}


