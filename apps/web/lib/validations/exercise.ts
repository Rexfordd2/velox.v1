import { z } from 'zod';

export const exerciseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  primary_muscle: z.string().min(1, 'Primary muscle is required'),
  secondary_muscles: z.array(z.string()),
  video_demo_url: z.string().url().optional(),
  category_ids: z.array(z.number()).min(1, 'At least one category is required'),
  equipment: z.array(z.string()),
  instructions: z.array(z.string()).min(1, 'At least one instruction is required')
});

export type Exercise = z.infer<typeof exerciseSchema>;

export const exerciseQuerySchema = z.object({
  search: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  primary_muscle: z.string().optional(),
  category_id: z.number().optional(),
  // Cursor pagination
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(24),
  sortBy: z.enum(['created_at', 'name', 'difficulty', 'primary_muscle']).default('created_at'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type ExerciseQuery = z.infer<typeof exerciseQuerySchema>; 