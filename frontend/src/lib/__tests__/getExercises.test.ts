import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getExercises } from '../getExercises';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
  }
}));

// Mock supabase singleton used by getExercises
const fromMock = vi.fn();
vi.mock('../supabase', () => ({
  supabase: { from: (...args: any[]) => fromMock(...args) }
}));

describe('getExercises', () => {
  const mockExercises = [
    {
      id: '1',
      name: 'Push-up',
      description: 'A classic exercise for upper body strength',
      difficulty: 'beginner',
      category: 'General',
      muscle_groups: ['chest', 'triceps', 'shoulders'],
      equipment: [],
      instructions: ['Start in plank position', 'Lower body until chest nearly touches ground', 'Push back up'],
      primary_muscle: undefined,
      secondary_muscles: [],
    },
    {
      id: '2',
      name: 'Squat',
      description: 'A fundamental lower body exercise',
      difficulty: 'beginner',
      category: 'General',
      muscle_groups: ['quadriceps', 'hamstrings', 'glutes'],
      equipment: [],
      instructions: ['Stand with feet shoulder-width apart', 'Lower body until thighs are parallel to ground', 'Return to standing position'],
      primary_muscle: undefined,
      secondary_muscles: [],
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch all exercises', async () => {
    const mockResponse = { data: [
      { ...mockExercises[0], id: 1 },
      { ...mockExercises[1], id: 2 },
    ], error: null } as any;
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getExercises();

    expect(result).toEqual(mockExercises);
    expect(fromMock).toHaveBeenCalledWith('exercises');
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Fetch failed');
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockRejectedValue(mockError)
    });

    await expect(getExercises()).rejects.toThrow('Fetch failed');
  });

  it('should return empty array when no exercises found', async () => {
    const mockResponse = { data: [], error: null } as any;
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getExercises();
    expect(result).toEqual([]);
  });
}); 