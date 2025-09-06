import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test/mocks/supabase';
import { getUserAchievements } from '../getUserAchievements';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
  }
}));

// Shared Supabase mock is imported above

describe('getUserAchievements', () => {
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
      exercise_id: 2,
      video_url: 'https://example.com/video3.mp4',
      score: 95,
      feedback: 'Perfect!',
      created_at: '2024-01-03T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully calculate user achievements', async () => {
    const { setMockTableData } = await import('../../test/mocks/supabase');
    setMockTableData('sessions', mockSessions as any);

    const result = await getUserAchievements('test-user');

    expect(result).toEqual({
      total_sessions: 3,
      perfect_scores: 1,
      high_scores: 1,
      exercise_mastery: {
        1: {
          total_sessions: 2,
          best_score: 90,
          average_score: 87.5
        },
        2: {
          total_sessions: 1,
          best_score: 95,
          average_score: 95
        }
      },
      recent_achievements: [
        {
          type: 'perfect_score',
          exercise_id: 2,
          date: '2024-01-03T00:00:00Z',
          score: 95
        },
        {
          type: 'high_score',
          exercise_id: 1,
          date: '2024-01-02T00:00:00Z',
          score: 90
        }
      ]
    });
    // Using shared Supabase mock; call assertion not applicable
  });

  it('should handle fetch errors', async () => {
    const { setMockTableError } = await import('../../test/mocks/supabase');
    setMockTableError('sessions', new Error('Fetch failed'));
    await expect(getUserAchievements('test-user')).rejects.toThrow('Fetch failed');
  });

  it('should return zero achievements for new users', async () => {
    const { setMockTableData } = await import('../../test/mocks/supabase');
    setMockTableData('sessions', []);
    const result = await getUserAchievements('new-user');
    expect(result).toEqual({
      total_sessions: 0,
      perfect_scores: 0,
      high_scores: 0,
      exercise_mastery: {},
      recent_achievements: []
    });
  });
}); 