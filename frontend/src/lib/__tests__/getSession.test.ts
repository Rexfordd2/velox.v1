import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSession } from '../getSession';
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

describe('getSession', () => {
  const mockSession = {
    id: 1,
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

  it('should successfully fetch a session', async () => {
    const mockResponse = { data: mockSession, error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getSession(1);

    expect(result).toEqual(mockSession);
    expect(supabase.from).toHaveBeenCalledWith('sessions');
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Fetch failed');
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockRejectedValue(mockError)
    });

    await expect(getSession(1)).rejects.toThrow('Fetch failed');
  });

  it('should handle non-existent session', async () => {
    const mockResponse = { data: null, error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockResponse)
    });

    await expect(getSession(999)).rejects.toThrow('Session not found');
  });
}); 