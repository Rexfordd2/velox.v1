import { createTRPCRouter, type Context } from "./trpc";
import { createClient } from "@supabase/supabase-js";
import { appRouter } from "./router";

export async function createCaller({ userId }: { userId: string }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon"
  );

  const ctx: Context = {
    user: { id: userId },
    supabase,
  };

  return appRouter.createCaller(ctx);
} 