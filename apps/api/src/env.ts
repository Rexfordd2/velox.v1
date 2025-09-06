import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  CORS_ALLOWED_ORIGINS: z.string().default('*').transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
});

function loadEnv() {
  const raw = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
  };
  try {
    const parsed = envSchema.parse(raw);
    if (parsed.NODE_ENV === 'production' && parsed.CORS_ALLOWED_ORIGINS.length === 0) {
      throw new Error('CORS_ALLOWED_ORIGINS must be a non-empty list in production');
    }
    return parsed;
  } catch (err) {
    const message = err instanceof z.ZodError ? err.errors.map((e) => e.path.join('.')).join(', ') : String(err);
    throw new Error(`Invalid API environment configuration: ${message}`);
  }
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;


