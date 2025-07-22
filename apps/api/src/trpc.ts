import { initTRPC, TRPCError } from '@trpc/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types/database';

// Context type definition
export interface Context {
  user: {
    id: string;
    email?: string;
  } | null;
  supabase: SupabaseClient<Database>;
}

const t = initTRPC.context<Context>().create();

// Base procedures
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
}); 