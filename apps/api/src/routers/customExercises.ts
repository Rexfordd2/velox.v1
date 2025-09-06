import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, publicProcedure, requireOwnership } from '../trpc';

const categoryEnum = z.enum(['lower', 'upper', 'core', 'olympic', 'other']);

const poseCriterionSchema = z.object({
  jointPairs: z.array(z.tuple([z.string(), z.string()])).optional(),
  angle: z.object({ joint: z.string(), min: z.number().optional(), max: z.number().optional() }).optional(),
  rom: z.object({ joint: z.string(), min: z.number().optional(), max: z.number().optional() }).optional(),
  velocity: z.object({ joint: z.string(), min: z.number().optional(), max: z.number().optional() }).optional(),
  holdMs: z.number().int().nonnegative().optional(),
  cueOnFail: z.string().optional(),
  weight: z.number().nonnegative().optional(),
});

const exerciseDefinitionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  category: categoryEnum,
  phases: z.array(
    z.object({
      name: z.string().min(1),
      criteria: z.array(poseCriterionSchema).min(1),
      transitionOn: z.enum(['angle', 'velocity', 'time', 'landmark']),
    })
  ).min(1),
  scoring: z.object({ passThreshold: z.number().min(0).max(1), severityBands: z.array(z.number()).min(1) }),
  version: z.number().int().min(1),
});

export const customExercisesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(exerciseDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      const { data: created, error: insertError } = await supabase
        .from('custom_exercises')
        .insert({ user_id: user.id, name: input.name, category: input.category })
        .select('id')
        .single();

      if (insertError || !created) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create exercise', cause: insertError });
      }

      const { error: critError } = await supabase
        .from('custom_exercise_criteria')
        .insert({ exercise_id: created.id, json_schema: input, version: input.version });

      if (critError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save criteria', cause: critError });
      }

      return { id: created.id };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .use(requireOwnership(async (supabase, input: { id: string }) => {
      const { data } = await supabase
        .from('custom_exercises')
        .select('id, user_id')
        .eq('id', input.id)
        .single();
      return data ? { ownerId: data.user_id } : null;
    }))
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      const { data, error } = await supabase
        .from('custom_exercises')
        .select('id, user_id, name, category, created_at, custom_exercise_criteria:custom_exercise_criteria(*)')
        .eq('id', input.id)
        .single();

      if (error) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercise not found', cause: error });
      }

      return data;
    }),

  listMine: protectedProcedure
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx;
      const { data, error } = await supabase
        .from('custom_exercises')
        .select('id, name, category, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch' });
      }
      return data ?? [];
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), definition: exerciseDefinitionSchema }))
    .use(requireOwnership(async (supabase, input: { id: string; definition: unknown }) => {
      const { data: existing } = await supabase
        .from('custom_exercises')
        .select('id, user_id')
        .eq('id', input.id)
        .single();
      return existing ? { ownerId: existing.user_id } : null;
    }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      const { error: updErr } = await supabase
        .from('custom_exercises')
        .update({ name: input.definition.name, category: input.definition.category })
        .eq('id', input.id);

      if (updErr) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update exercise', cause: updErr });
      }

      // Store a new criteria version row (append-only)
      const { error: critErr } = await supabase
        .from('custom_exercise_criteria')
        .insert({ exercise_id: input.id, json_schema: input.definition, version: input.definition.version });

      if (critErr) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save criteria', cause: critErr });
      }

      return { success: true } as const;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .use(requireOwnership(async (supabase, input: { id: string }) => {
      const { data: existing } = await supabase
        .from('custom_exercises')
        .select('id, user_id')
        .eq('id', input.id)
        .single();
      return existing ? { ownerId: existing.user_id } : null;
    }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // Delete criteria first due to FK
      const { error: delCritErr } = await supabase
        .from('custom_exercise_criteria')
        .delete()
        .eq('exercise_id', input.id);

      if (delCritErr) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete criteria', cause: delCritErr });
      }

      const { error: delErr } = await supabase
        .from('custom_exercises')
        .delete()
        .eq('id', input.id);

      if (delErr) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete exercise', cause: delErr });
      }

      return { success: true } as const;
    }),
});


