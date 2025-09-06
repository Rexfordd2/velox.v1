"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthSessionSync() {
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    let isMounted = true;

    const syncCookies = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (session) {
        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_in: Math.max(0, Math.floor(((session.expires_at ?? 0) * 1000 - Date.now()) / 1000)),
          }),
        });
      } else {
        await fetch('/api/auth/clear-session', { method: 'POST' });
      }
    };

    // initial sync
    syncCookies();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session) {
        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_in: Math.max(0, Math.floor(((session.expires_at ?? 0) * 1000 - Date.now()) / 1000)),
          }),
        });
      } else {
        await fetch('/api/auth/clear-session', { method: 'POST' });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return null;
}


