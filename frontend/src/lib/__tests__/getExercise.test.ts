import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getExercise } from '../getExercise';
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
      single: vi.fn()
    }))
  }))
}));

describe('getExercise', () => {
  const mockExercise = {
    id: 1,
    name: 'Push-up',
    description: 'A classic exercise for upper body strength',
    difficulty: 'beginner',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    instructions: ['Start in plank position', 'Lower body until chest nearly touches ground', 'Push back up'],
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch an exercise', async () => {
    const mockResponse = { data: mockExercise, error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getExercise(1);

    expect(result).toEqual(mockExercise);
    expect(supabase.from).toHaveBeenCalledWith('exercises');
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Fetch failed');
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockRejectedValue(mockError)
    });

    await expect(getExercise(1)).rejects.toThrow('Fetch failed');
  });

  it('should handle non-existent exercise', async () => {
    const mockResponse = { data: null, error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockResponse)
    });

    await expect(getExercise(999)).rejects.toThrow('Exercise not found');
  });
}); 