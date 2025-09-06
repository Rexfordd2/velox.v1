import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { type inferAsyncReturnType } from "@trpc/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

export async function createContext(opts: { req: Request }) {
  const authHeader = opts.req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, anonKey);

  let user: { id: string; email?: string; role?: string } | null = null;
  if (token) {
    try {
      const { data } = await supabase.auth.getUser(token);
      if (data.user) {
        user = {
          id: data.user.id,
          email: data.user.email ?? undefined,
          role: (data.user.user_metadata as any)?.role,
        };
      }
    } catch {}
  }

  return { user, supabase } as { user: { id: string; email?: string; role?: string } | null; supabase: SupabaseClient };
}

export type Context = inferAsyncReturnType<typeof createContext>;


