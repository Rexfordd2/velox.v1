import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAudioFeatures, getCurrentTrack, startPlayback, transferPlayback } from '../src/sources/spotify';

const token = 'test-token';

describe('spotify client (fetch mocked)', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn(async (url: any, init?: any) => {
      const u = String(url);
      if (u.includes('/currently-playing')) {
        return new Response(JSON.stringify({ is_playing: true, progress_ms: 1234, item: { id: 'trk', name: 'Song', artists: [{ name: 'Artist' }] } }), { status: 200 });
      }
      if (u.includes('/audio-features/')) {
        return new Response(JSON.stringify({ tempo: 128.4 }), { status: 200 });
      }
      if (u.includes('/me/player/play')) {
        return new Response(null, { status: 204 });
      }
      if (u.endsWith('/me/player')) {
        return new Response(null, { status: 204 });
      }
      return new Response('not found', { status: 404 });
    }) as any;
  });

  afterEach(() => {
    global.fetch = realFetch as any;
  });

  it('gets current track', async () => {
    const cur = await getCurrentTrack(token);
    expect(cur?.is_playing).toBe(true);
    expect(cur?.item?.id).toBe('trk');
  });

  it('gets audio features with tempo', async () => {
    const af = await getAudioFeatures(token, 'trk');
    expect(af?.tempo).toBeCloseTo(128.4, 1);
  });

  it('starts playback on device', async () => {
    await expect(startPlayback(token, 'device', 'spotify:track:trk', 5000)).resolves.toBeUndefined();
  });

  it('transfers playback to device', async () => {
    await expect(transferPlayback(token, 'device')).resolves.toBeUndefined();
  });
});


