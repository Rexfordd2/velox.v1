import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getExercises } from '../getExercises';
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
      order: vi.fn()
    }))
  }))
}));

describe('getExercises', () => {
  const mockExercises = [
    {
      id: 1,
      name: 'Push-up',
      description: 'A classic exercise for upper body strength',
      difficulty: 'beginner',
      muscle_groups: ['chest', 'triceps', 'shoulders'],
      instructions: ['Start in plank position', 'Lower body until chest nearly touches ground', 'Push back up'],
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Squat',
      description: 'A fundamental lower body exercise',
      difficulty: 'beginner',
      muscle_groups: ['quadriceps', 'hamstrings', 'glutes'],
      instructions: ['Stand with feet shoulder-width apart', 'Lower body until thighs are parallel to ground', 'Return to standing position'],
      created_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch all exercises', async () => {
    const mockResponse = { data: mockExercises, error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getExercises();

    expect(result).toEqual(mockExercises);
    expect(supabase.from).toHaveBeenCalledWith('exercises');
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Fetch failed');
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockRejectedValue(mockError)
    });

    await expect(getExercises()).rejects.toThrow('Fetch failed');
  });

  it('should return empty array when no exercises found', async () => {
    const mockResponse = { data: [], error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getExercises();
    expect(result).toEqual([]);
  });
}); 