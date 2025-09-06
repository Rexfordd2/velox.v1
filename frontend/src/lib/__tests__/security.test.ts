import { describe, it, expect, vi, beforeEach } from 'vitest';
// Use mocked supabase client from test setup
import { mockSupabaseClient as supabase, setStrictRLS } from '../../test/mocks/supabase';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
  }
}));

describe('Security Tests', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    setStrictRLS(true);
  });

  describe('Row Level Security', () => {
    it('should prevent users from accessing other users sessions', async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', 'other-user-id');

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    it('should prevent users from accessing other users profiles', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', 'other-user-id');

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    it('should prevent users from modifying other users sessions', async () => {
      const { data, error } = await supabase
        .from('sessions')
        .update({ score: 100 })
        .eq('user_id', 'other-user-id');

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    it('should prevent users from deleting other users sessions', async () => {
      const { data, error } = await supabase
        .from('sessions')
        .delete()
        .eq('user_id', 'other-user-id');

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });

  describe('API Security', () => {
    it('should enforce rate limiting', async () => {
      const requests = Array(101).fill(null).map(() =>
        supabase.from('sessions').select('*')
      );

      const results = await Promise.all(requests);
      const errors = results.filter(r => r.error);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should require authentication for protected routes', async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*');

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });
}); 