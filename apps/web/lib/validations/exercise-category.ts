import { z } from 'zod';

export const exerciseCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

export const exerciseCategoryQuerySchema = z.object({
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
}); 