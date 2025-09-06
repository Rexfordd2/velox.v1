import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@tanstack/react-query', async (orig) => {
  const mod = await orig()
  return {
    ...mod,
    useInfiniteQuery: () => ({
      data: { pages: [{ posts: [{ id: '1' }, { id: '2' }] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      status: 'success',
    }),
  }
})

vi.mock('../(community)/hooks/useInViewLocal', () => ({
  useInViewLocal: () => ({ ref: vi.fn(), inView: false }),
}))

describe('Community page basic render', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('imports page component without throwing', async () => {
    const page = await import('../(community)/page')
    expect(page).toBeTruthy()
  })
})


