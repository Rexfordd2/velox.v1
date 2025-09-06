import { z } from 'zod';

// Environment variable schema with validation
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),

  // App configuration
  APP_URL: z.string().optional(),
  APP_VERSION: z.string().optional(),

  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  // CDN Configuration
  VIDEO_PROCESSING_CDN_URL: z.string().optional(),
  ASSETS_CDN_URL: z.string().optional(),
  CDN_SECRET_KEY: z.string().optional(),

  // Analytics
  NEXT_PUBLIC_ANALYTICS_URL: z.string().optional(),
  NEXT_PUBLIC_ANALYTICS_KEY: z.string().optional(),

  // Redis configuration
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().min(1).optional(),

  // Analytics and monitoring
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  // Security configuration
  CORS_ALLOWED_ORIGINS: z.string().transform(str => str.split(',')),
  API_RATE_LIMIT: z.coerce.number().default(100),
  API_RATE_LIMIT_WINDOW: z.coerce.number().default(60),
  JWT_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),

  // Feature flags
  ENABLE_VIDEO_PROCESSING: z.boolean().optional(),
  ENABLE_ANALYTICS: z.boolean().optional(),
  ENABLE_SENTRY: z.boolean().optional(),
});

// Process environment variables
const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  APP_URL: process.env.APP_URL,
  APP_VERSION: process.env.APP_VERSION || '1.0.0',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
  UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || '*',
  API_RATE_LIMIT: process.env.API_RATE_LIMIT,
  API_RATE_LIMIT_WINDOW: process.env.API_RATE_LIMIT_WINDOW,
  JWT_SECRET: process.env.JWT_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS,
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING,
  ENABLE_SENTRY: process.env.ENABLE_SENTRY,
};

// Validate and export environment configuration
const validateEnv = () => {
  try {
    return envSchema.parse(processEnv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map(err => err.path.join('.'))
        .join(', ');
      throw new Error(
        `❌ Invalid environment variables: ${missingVars}\n${error.message}`
      );
    }
    throw error;
  }
};

export const env = validateEnv();

// Type definition for environment configuration
export type Env = z.infer<typeof envSchema>;

// Helper function to check if we're in production
export const isProd = env.NODE_ENV === 'production';

// Helper function to check if we're in development
export const isDev = env.NODE_ENV === 'development';

// Helper function to check if we're in test
export const isTest = env.NODE_ENV === 'test'; 