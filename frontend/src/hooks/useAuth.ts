import { useState, useEffect } from 'react';
import { mockAuth, MockUser, MockSession } from '@/lib/mock-auth';

// Use mock auth directly since we're having type issues with the unified interface
export function useAuth() {
  const [user, setUser] = useState<MockUser | null>(mockAuth.getUser());
  const [session, setSession] = useState<MockSession | null>(mockAuth.getSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    const session = mockAuth.getSession();
    setSession(session);
    setUser(session?.user || null);
    setLoading(false);

    // Subscribe to auth changes
    const unsubscribe = mockAuth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { user, error } = await mockAuth.signIn(email, password);
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await mockAuth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
  };
} 