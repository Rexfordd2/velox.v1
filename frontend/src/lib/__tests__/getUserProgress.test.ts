import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserProgress } from '../getUserProgress';
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

describe('getUserProgress', () => {
  const mockSessions = [
    {
      id: 1,
      user_id: 'test-user',
      exercise_id: 1,
      video_url: 'https://example.com/video1.mp4',
      score: 85,
      feedback: 'Good form!',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      user_id: 'test-user',
      exercise_id: 1,
      video_url: 'https://example.com/video2.mp4',
      score: 90,
      feedback: 'Excellent!',
      created_at: '2024-01-02T00:00:00Z'
    },
    {
      id: 3,
      user_id: 'test-user',
      exercise_id: 1,
      video_url: 'https://example.com/video3.mp4',
      score: 95,
      feedback: 'Perfect!',
      created_at: '2024-01-03T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully calculate user progress', async () => {
    const mockResponse = { data: mockSessions, error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getUserProgress('test-user', 1);

    expect(result).toEqual({
      exercise_id: 1,
      total_sessions: 3,
      average_score: 90,
      best_score: 95,
      progress_trend: 'improving',
      last_session: {
        score: 95,
        feedback: 'Perfect!',
        date: '2024-01-03T00:00:00Z'
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

    await expect(getUserProgress('test-user', 1)).rejects.toThrow('Fetch failed');
  });

  it('should return zero progress for new exercises', async () => {
    const mockResponse = { data: [], error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getUserProgress('new-user', 1);
    expect(result).toEqual({
      exercise_id: 1,
      total_sessions: 0,
      average_score: 0,
      best_score: 0,
      progress_trend: 'neutral',
      last_session: null
    });
  });

  it('should detect declining progress', async () => {
    const decliningSessions = [
      {
        id: 1,
        user_id: 'test-user',
        exercise_id: 1,
        video_url: 'https://example.com/video1.mp4',
        score: 95,
        feedback: 'Perfect!',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        user_id: 'test-user',
        exercise_id: 1,
        video_url: 'https://example.com/video2.mp4',
        score: 90,
        feedback: 'Good!',
        created_at: '2024-01-02T00:00:00Z'
      },
      {
        id: 3,
        user_id: 'test-user',
        exercise_id: 1,
        video_url: 'https://example.com/video3.mp4',
        score: 85,
        feedback: 'Keep practicing',
        created_at: '2024-01-03T00:00:00Z'
      }
    ];

    const mockResponse = { data: decliningSessions, error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getUserProgress('test-user', 1);
    expect(result.progress_trend).toBe('declining');
  });
}); 