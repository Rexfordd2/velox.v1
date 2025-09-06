"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton({ className }: { className?: string }) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    await fetch('/api/auth/clear-session', { method: 'POST' });
    setLoading(false);
    router.push("/login");
  }

  return (
    <button onClick={onLogout} disabled={loading} className={className}>
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}


