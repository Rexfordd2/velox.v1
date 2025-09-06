import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('GET /api/progress/trends', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('fetch', mockFetch as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns shaped trends data', async () => {
    const mockDaily = [
      { date: '2025-08-01', avg_score: 80, p95_score: 92, rom_mean: 0.6 },
      { date: '2025-08-02', avg_score: 82, p95_score: 94, rom_mean: 0.62 },
    ]
    const mockRolling = [
      { date: '2025-08-02', avg28d: 81, delta7d: 1.5 },
    ]

    // Mock API response from our Next.js handler path
    // In app tests, we'd import the handler directly; here we simulate client usage via frontend lib call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        daily: mockDaily.map((d) => ({ date: d.date, avg: d.avg_score, p95: d.p95_score, rom: d.rom_mean })),
        rolling: mockRolling.map((r) => ({ date: r.date, avg28d: r.avg28d, delta7d: r.delta7d, trend: 'up' as const })),
      })
    })

    const { getFormTrends } = await import('../../../frontend/src/lib/getUserProgress')
    const data = await getFormTrends('squat')

    expect(data.daily).toHaveLength(2)
    expect(data.daily[0]).toEqual({ date: '2025-08-01', avg: 80, p95: 92, rom: 0.6 })
    expect(data.rolling[0].trend).toBe('up')
  })

  it('handles API 401 error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) })
    const { getFormTrends } = await import('../../../frontend/src/lib/getUserProgress')
    await expect(getFormTrends('squat')).rejects.toBeTruthy()
  })

  it('handles API 500 error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'x' }) })
    const { getFormTrends } = await import('../../../frontend/src/lib/getUserProgress')
    await expect(getFormTrends('bench')).rejects.toBeTruthy()
  })
})


