import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test/mocks/supabase';
import { getUserProfile } from '../getUserProfile';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
  }
}));

// Shared Supabase mock is imported above

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
    const { setMockTableData, setStrictRLS } = await import('../../test/mocks/supabase');
    setStrictRLS(false);
    setMockTableData('profiles', [mockProfile] as any);
    const result = await getUserProfile(mockProfile.username);

    expect(result).toEqual(mockProfile);
  });

  it('should handle fetch errors', async () => {
    // Simulate error via shared mock setter
    const { setMockTableError } = await import('../../test/mocks/supabase');
    setMockTableError('profiles', new Error('Fetch failed'));
    await expect(getUserProfile('test-user')).rejects.toThrow('Fetch failed');
  });

  it('should handle non-existent profile', async () => {
    const { setMockTableData, setMockTableError } = await import('../../test/mocks/supabase');
    setMockTableData('profiles', []);
    setMockTableError('profiles', null);
    await expect(getUserProfile('non-existent')).rejects.toThrow('Profile not found');
  });
}); 