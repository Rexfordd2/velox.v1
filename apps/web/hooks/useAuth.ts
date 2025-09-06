"use client";
import { useState, useEffect } from 'react';

export type WebUser = {
  id: string;
  username: string;
  avatar_url?: string;
};

export function useAuth() {
  const [user, setUser] = useState<WebUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Placeholder: integrate with your real auth provider here
    setLoading(false);
  }, []);

  return {
    user,
    session,
    loading,
    signIn: async () => ({ user: null, error: null }),
    signOut: async () => ({ error: null }),
  };
}
