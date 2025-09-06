import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  // In server components we cannot easily access browser session; rely on middleware to block unauthenticated.
  // As an extra safety, just render container.
  return <div className="admin-layout">{children}</div>;
}