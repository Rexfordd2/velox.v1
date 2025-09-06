import { User } from '@supabase/supabase-js';

export type MockSession = {
  user: MockUser | null;
  access_token: string;
  expires_at: number;
};

export type MockUser = {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
};

const MOCK_USER: MockUser = {
  id: 'mock-user-123',
  email: 'demo@example.com',
  username: 'demo_user',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  created_at: new Date().toISOString(),
};

class MockAuthService {
  private storageKey = 'mock_auth_session';

  constructor() {
    // Initialize session from storage on service creation
    this.getSession();
  }

  async signIn(email: string, password: string): Promise<{ user: MockUser | null; error: Error | null }> {
    // Simple mock authentication - accept any email/password
    if (email && password) {
      const session = {
        user: MOCK_USER,
        access_token: 'mock_token_' + Math.random(),
        expires_at: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
      };
      this.saveSession(session);
      return { user: MOCK_USER, error: null };
    }
    return { user: null, error: new Error('Invalid credentials') };
  }

  async signOut(): Promise<{ error: Error | null }> {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(this.storageKey); } catch {}
    }
    return { error: null };
  }

  getSession(): MockSession | null {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem(this.storageKey);
    if (!session) return null;
    
    try {
      const parsedSession = JSON.parse(session) as MockSession;
      // Check if session is expired
      if (parsedSession.expires_at < Date.now()) {
        localStorage.removeItem(this.storageKey);
        return null;
      }
      return parsedSession;
    } catch (e) {
      return null;
    }
  }

  getUser(): MockUser | null {
    const session = this.getSession();
    return session?.user || null;
  }

  private saveSession(session: MockSession) {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(this.storageKey, JSON.stringify(session)); } catch {}
    }
  }

  onAuthStateChange(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT', session: MockSession | null) => void) {
    // Simple event listener for auth state changes
    const handleStorage = () => {
      const session = this.getSession();
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
    return () => {};
  }
}

export const mockAuth = new MockAuthService(); 