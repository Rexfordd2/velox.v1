import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test/mocks/supabase';
import { getUserRecommendations } from '../getUserRecommendations';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
  }
}));

// Shared Supabase mock is imported above

describe('getUserRecommendations', () => {
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
      score: 75,
      feedback: 'Keep practicing',
      created_at: '2024-01-03T00:00:00Z'
    }
  ];

  const mockExercises = [
    {
      id: 1,
      name: 'Push-up',
      description: 'A classic exercise for upper body strength',
      difficulty: 'beginner',
      muscle_groups: ['chest', 'triceps', 'shoulders'],
      instructions: ['Start in plank position', 'Lower body until chest nearly touches ground', 'Push back up'],
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Squat',
      description: 'A fundamental lower body exercise',
      difficulty: 'beginner',
      muscle_groups: ['quadriceps', 'hamstrings', 'glutes'],
      instructions: ['Stand with feet shoulder-width apart', 'Lower body until thighs are parallel to ground', 'Return to standing position'],
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 3,
      name: 'Pull-up',
      description: 'An advanced upper body exercise',
      difficulty: 'advanced',
      muscle_groups: ['back', 'biceps', 'shoulders'],
      instructions: ['Hang from bar with hands shoulder-width apart', 'Pull body up until chin is over bar', 'Lower back down with control'],
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully generate recommendations', async () => {
    const { setMockTableData } = await import('../../test/mocks/supabase');
    setMockTableData('sessions', mockSessions as any);
    setMockTableData('exercises', mockExercises as any);

    const result = await getUserRecommendations('test-user');

    expect(result).toEqual({
      practice_more: [
        {
          id: 2,
          name: 'Squat',
          description: 'A fundamental lower body exercise',
          difficulty: 'beginner',
          muscle_groups: ['quadriceps', 'hamstrings', 'glutes'],
          instructions: ['Stand with feet shoulder-width apart', 'Lower body until thighs are parallel to ground', 'Return to standing position'],
          created_at: '2024-01-01T00:00:00Z',
          reason: 'Your last score was 75, which is below the target score of 85'
        }
      ],
      try_next: [
        {
          id: 3,
          name: 'Pull-up',
          description: 'An advanced upper body exercise',
          difficulty: 'advanced',
          muscle_groups: ['back', 'biceps', 'shoulders'],
          instructions: ['Hang from bar with hands shoulder-width apart', 'Pull body up until chin is over bar', 'Lower back down with control'],
          created_at: '2024-01-01T00:00:00Z',
          reason: 'You have mastered intermediate exercises, try this advanced exercise'
        }
      ]
    });
  });

  it('should handle fetch errors', async () => {
    const { setMockTableError } = await import('../../test/mocks/supabase');
    setMockTableError('sessions', new Error('Fetch failed'));
    await expect(getUserRecommendations('test-user')).rejects.toThrow('Fetch failed');
  });

  it('should return all exercises for new users', async () => {
    const { setMockTableData, setStrictRLS } = await import('../../test/mocks/supabase');
    setStrictRLS(false);
    setMockTableData('sessions', []);
    setMockTableData('exercises', mockExercises as any);

    const result = await getUserRecommendations('new-user');
    expect(result.try_next).toHaveLength(2);
    expect(result.practice_more).toHaveLength(0);
  });
}); 