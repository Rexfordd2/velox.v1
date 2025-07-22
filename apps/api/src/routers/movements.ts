import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const movementsRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      const { supabase } = ctx;

      const { data: movements, error } = await supabase
        .from('movements')
        .select(`
          id,
          name,
          difficulty_level,
          muscle_groups
        `)
        .order('name');

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch movements',
          cause: error,
        });
      }

      return movements || [];
    }),
}); 