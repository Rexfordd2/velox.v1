import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test/mocks/supabase';
import { getSession } from '../getSession';
import { createClient } from '@supabase/supabase-js';
import { setMockTableData, setMockTableError, resetSupabaseMock } from '../../test/mocks/supabase';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
  }
}));

// Use shared mocked supabase client from test/mocks/supabase

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
    resetSupabaseMock();
  });

  it('should successfully fetch a session', async () => {
    setMockTableData('sessions', [mockSession]);

    const result = await getSession(1);

    expect(result).toEqual(mockSession);
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Fetch failed');
    setMockTableError('sessions', mockError);
    await expect(getSession(1)).rejects.toThrow('Fetch failed');
  });

  it('should handle non-existent session', async () => {
    setMockTableData('sessions', []);
    await expect(getSession(999)).rejects.toThrow('Session not found');
  });
}); 