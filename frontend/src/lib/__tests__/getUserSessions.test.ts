import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserSessions } from '../getUserSessions';
// Mock supabase singleton
const fromMock = vi.fn();
vi.mock('../supabase', () => ({ supabase: { from: (...a: any[]) => fromMock(...a) } }));

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
  }
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn()
    }))
  }))
}));

describe('getUserSessions', () => {
  const mockSessions = [
    {
      id: 1,
      user_id: 'test-user',
      exercise_id: 1,
      video_url: 'https://example.com/video1.mp4',
      score: 85,
      feedback: 'Good form!',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      user_id: 'test-user',
      exercise_id: 2,
      video_url: 'https://example.com/video2.mp4',
      score: 90,
      feedback: 'Excellent!',
      created_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch user sessions', async () => {
    const mockResponse = { data: mockSessions, error: null } as any;
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getUserSessions('test-user');

    expect(result).toEqual(mockSessions);
    expect(fromMock).toHaveBeenCalledWith('sessions');
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Fetch failed');
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockRejectedValue(mockError)
    });

    await expect(getUserSessions('test-user')).rejects.toThrow('Fetch failed');
  });

  it('should return empty array when no sessions found', async () => {
    const mockResponse = { data: [], error: null } as any;
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getUserSessions('test-user');
    expect(result).toEqual([]);
  });
}); 