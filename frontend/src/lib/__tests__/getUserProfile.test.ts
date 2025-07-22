import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserProfile } from '../getUserProfile';
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

describe('getUserProfile', () => {
  const mockProfile = {
    id: 'test-user',
    username: 'testuser',
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch user profile', async () => {
    const mockResponse = { data: mockProfile, error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await getUserProfile('test-user');

    expect(result).toEqual(mockProfile);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Fetch failed');
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockRejectedValue(mockError)
    });

    await expect(getUserProfile('test-user')).rejects.toThrow('Fetch failed');
  });

  it('should handle non-existent profile', async () => {
    const mockResponse = { data: null, error: null };
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockResponse)
    });

    await expect(getUserProfile('non-existent')).rejects.toThrow('Profile not found');
  });
}); 