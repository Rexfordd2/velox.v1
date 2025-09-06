import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';

// Context type definition
export interface Context {
  user: {
    id: string;
    email?: string;
    role?: string;
    tenantId?: string;
  } | null;
  supabase: SupabaseClient;
}

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    const cause = (error as any)?.cause;
    const zod = cause instanceof ZodError ? cause : (cause?.issues ? cause : null);
    const flattened = zod instanceof ZodError ? zod.flatten() : undefined;
    return {
      ...shape,
      data: {
        ...shape.data,
        fieldErrors: flattened?.fieldErrors,
        formErrors: flattened?.formErrors,
      },
    } as typeof shape & {
      data: typeof shape.data & {
        fieldErrors?: Record<string, string[]>;
        formErrors?: string[];
      };
    };
  },
});

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

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  const isAdmin = (ctx.user as any).role === 'admin';
  if (!isAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
  }
  return next();
});

// Role-based guard: require specific roles
export const requireRole = (roles: string[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const role = (ctx.user as any).role;
    if (!role || !roles.includes(role)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next();
  });

// Ownership guard factory: verifies user owns a record before proceeding
// fetchOwner: (supabase, input) => Promise<{ ownerId: string; tenantId?: string } | null>
export const requireOwnership = <I,>(fetchOwner: (supabase: SupabaseClient, input: I) => Promise<{ ownerId: string; tenantId?: string } | null>) =>
  t.middleware(async ({ ctx, next, getRawInput }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const raw = await getRawInput();
    const owner = await fetchOwner(ctx.supabase, raw as I);
    if (!owner) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    if (owner.ownerId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    // Optional tenant isolation: if both sides have tenantId, enforce equality
    if (owner.tenantId && ctx.user.tenantId && owner.tenantId !== ctx.user.tenantId) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next();
  });

// Tenant guard: ensure the current user belongs to the tenant in input or resource
export const requireTenant = <I,>(getTenantId: (input: I) => string | undefined) =>
  t.middleware(({ ctx, next, getRawInput }) => {
    const inputTenant = ((): string | undefined => {
      try {
        const raw = getRawInput?.();
        return (raw as any)?.tenantId ?? undefined;
      } catch {
        return undefined;
      }
    })();
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    if (inputTenant && ctx.user.tenantId && inputTenant !== ctx.user.tenantId) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next();
  });