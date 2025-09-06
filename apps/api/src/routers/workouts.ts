import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const getHistorySchema = z.object({
  exerciseType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timeRange: z.enum(['week', 'month', 'year']).optional(),
  limit: z.number().min(1).max(100).default(25),
  cursor: z.string().optional(), // ISO created_at cursor
  sortBy: z.enum(['created_at', 'exercise_type', 'form_score', 'rep_count']).default('created_at'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export const workoutsRouter = createTRPCRouter({
  getHistory: protectedProcedure
    .input(getHistorySchema)
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      const { exerciseType, startDate, endDate, timeRange, limit, cursor, sortBy, sortDir } = input;

      let query = supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order(sortBy, { ascending: sortDir === 'asc' })
        .limit(limit + 1); // fetch one extra to infer nextCursor

      if (exerciseType) {
        query = query.eq('exercise_type', exerciseType);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      if (timeRange) {
        const now = new Date();
        let startTime: Date | null = null;
        switch (timeRange) {
          case 'week':
            startTime = new Date();
            startTime.setDate(now.getDate() - 7);
            break;
          case 'month':
            startTime = new Date();
            startTime.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startTime = new Date();
            startTime.setFullYear(now.getFullYear() - 1);
            break;
        }
        if (startTime) {
          query = query.gte('created_at', startTime.toISOString());
        }
      }

      // Cursor on created_at for stable pagination default; if sorting by a different column, still use created_at cursor as tiebreaker.
      if (cursor) {
        if (sortDir === 'asc') {
          query = query.gt('created_at', cursor);
        } else {
          query = query.lt('created_at', cursor);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch workout history',
          cause: error,
        });
      }

      const rows = data ?? [];
      let nextCursor: string | undefined = undefined;
      if (rows.length > limit) {
        const next = rows.pop();
        nextCursor = next?.created_at as string | undefined;
      }

      return { items: rows, nextCursor } as const;
    }),

  getPersonalBests: protectedProcedure
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx;

      const { data, error } = await supabase.rpc('get_user_personal_bests', {
        p_user_id: user.id,
      });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch personal bests',
          cause: error,
        });
      }

      return (data ?? []).map((row: any) => ({
        type: row.exercise_type,
        best_form_score: row.best_form_score,
        best_form_score_date: row.best_form_score_date,
        max_reps: row.max_reps,
        max_reps_date: row.max_reps_date,
        best_duration: row.best_duration,
        best_duration_date: row.best_duration_date,
        max_weight: row.max_weight,
        max_weight_date: row.max_weight_date,
      }));
    }),

  getRecent: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      const { limit } = input;

      const { data: workouts, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          exercise_type,
          rep_count,
          form_score,
          duration,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch recent workouts',
          cause: error,
        });
      }

      return workouts || [];
    }),
}); 