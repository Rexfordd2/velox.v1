import { describe, it, expect, vi, beforeEach } from 'vitest';
import { insertSession } from '../insertSession';
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
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn()
    }))
  }))
}));

describe('insertSession', () => {
  const mockSession = {
    user_id: 'test-user',
    exercise_id: 1,
    video_url: 'https://example.com/video.mp4',
    score: 85,
    feedback: 'Good form!',
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully insert a session', async () => {
    const mockResponse = { data: mockSession, error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await insertSession(mockSession);

    expect(result).toEqual(mockSession);
    expect(supabase.from).toHaveBeenCalledWith('sessions');
  });

  it('should handle insertion errors', async () => {
    const mockError = new Error('Insert failed');
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockRejectedValue(mockError)
    });

    await expect(insertSession(mockSession)).rejects.toThrow('Insert failed');
  });

  it('should validate required fields', async () => {
    const invalidSession = {
      user_id: 'test-user',
      // Missing exercise_id
      video_url: 'https://example.com/video.mp4',
      score: 85
    };

    await expect(insertSession(invalidSession as any)).rejects.toThrow('Missing required fields');
  });
}); 