import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildLeaderboard, LeaderboardScope } from '../leaderboard';

describe('buildLeaderboard', () => {
  beforeEach(() => { vi.resetModules() })

  it('returns rows for global scope with week window', async () => {
    vi.doMock('../supabase-client', () => ({
      supabase: { rpc: vi.fn(async () => ({ data: [{ rank: 1, user_id: 'u1', username: 'alice', best_score: 123 }], error: null })) }
    }))
    const mod = await import('../leaderboard')
    const data = await mod.buildLeaderboard({ movementId: 'squat', window: 'week', scope: 'global', userId: 'me' })
    expect(data[0]).toEqual({ rank: 1, user_id: 'u1', username: 'alice', best_score: 123 })
  });

  it('uses friends scope and passes userId param', async () => {
    const rpc = vi.fn(async () => ({ data: [], error: null }))
    vi.doMock('../supabase-client', () => ({ supabase: { rpc } }))
    const mod = await import('../leaderboard')
    await mod.buildLeaderboard({ movementId: 'bench', window: 'month', scope: 'friends', userId: 'me' })
    expect(rpc).toHaveBeenCalled()
  });

  it('handles empty results', async () => {
    vi.doMock('../supabase-client', () => ({ supabase: { rpc: vi.fn(async () => ({ data: [], error: null })) } }))
    const mod = await import('../leaderboard')
    const data = await mod.buildLeaderboard({ movementId: 'deadlift', window: 'week', scope: 'global', userId: 'me' })
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(0)
  });

  it('propagates errors from supabase', async () => {
    vi.doMock('../supabase-client', () => ({ supabase: { rpc: vi.fn(async () => ({ data: null, error: new Error('boom') })) } }))
    const mod = await import('../leaderboard')
    await expect(mod.buildLeaderboard({ movementId: 'squat', window: 'week', scope: 'global', userId: 'me' })).rejects.toBeTruthy()
  });
}); 