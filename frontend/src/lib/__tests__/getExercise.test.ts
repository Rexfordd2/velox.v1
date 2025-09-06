import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test/mocks/supabase';
import { getExercise } from '../getExercise';
import { setMockTableData, setMockTableError, resetSupabaseMock } from '../../test/mocks/supabase';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
  }
}));

// Use shared mocked supabase client from test/mocks/supabase

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
    resetSupabaseMock();
  });

  it('should successfully fetch an exercise', async () => {
    setMockTableData('exercises', [mockExercise]);

    const result = await getExercise(1);

    expect(result).toEqual(mockExercise);
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Fetch failed');
    setMockTableError('exercises', mockError);
    await expect(getExercise(1)).rejects.toThrow('Fetch failed');
  });

  it('should handle non-existent exercise', async () => {
    setMockTableData('exercises', []);
    await expect(getExercise(999)).rejects.toThrow('Exercise not found');
  });
}); 