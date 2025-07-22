import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const getHistorySchema = z.object({
  exerciseType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timeRange: z.enum(['week', 'month', 'year']).optional(),
  limit: z.number().min(1).max(100).default(50),
});

export const workoutsRouter = createTRPCRouter({
  getHistory: protectedProcedure
    .input(getHistorySchema)
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      const { exerciseType, startDate, endDate, timeRange, limit } = input;

      let query = supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

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
        let startTime: Date;

        switch (timeRange) {
          case 'week':
            startTime = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startTime = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startTime = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        }

        query = query.gte('created_at', startTime.toISOString());
      }

      const { data: workouts, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch workout history',
          cause: error,
        });
      }

      return workouts || [];
    }),

  getPersonalBests: protectedProcedure
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx;

      const { data: exercises, error: exercisesError } = await supabase
        .from('workout_sessions')
        .select('exercise_type')
        .eq('user_id', user.id)
        .distinct();

      if (exercisesError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch exercises',
          cause: exercisesError,
        });
      }

      const personalBests = await Promise.all(
        exercises.map(async ({ exercise_type }) => {
          const { data: bests, error: bestsError } = await supabase
            .rpc('get_exercise_personal_bests', {
              p_user_id: user.id,
              p_exercise_type: exercise_type,
            });

          if (bestsError) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to fetch personal bests',
              cause: bestsError,
            });
          }

          return {
            type: exercise_type,
            ...bests[0],
          };
        })
      );

      return personalBests;
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