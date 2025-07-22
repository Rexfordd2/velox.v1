import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserStats } from '../getUserStats';
import { createClient } from '@supabase/supabase-js';

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

describe('getUserStats', () => {
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
      exercise_id: 1,
      video_url: 'https://example.com/video2.mp4',
      score: 90,
      feedback: 'Excellent!',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      user_id: 'test-user',
      exercise_id: 2,
      video_url: 'https://example.com/video3.mp4',
      score: 75,
      feedback: 'Keep practicing',
      created_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully calculate user stats', async () => {
    const mockResponse = { data: mockSessions, error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getUserStats('test-user');

    expect(result).toEqual({
      total_sessions: 3,
      average_score: 83.33,
      best_score: 90,
      exercise_counts: {
        1: 2,
        2: 1
      }
    });
    expect(supabase.from).toHaveBeenCalledWith('sessions');
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Fetch failed');
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockRejectedValue(mockError)
    });

    await expect(getUserStats('test-user')).rejects.toThrow('Fetch failed');
  });

  it('should return zero stats for new users', async () => {
    const mockResponse = { data: [], error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getUserStats('new-user');
    expect(result).toEqual({
      total_sessions: 0,
      average_score: 0,
      best_score: 0,
      exercise_counts: {}
    });
  });
}); 