import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),

  // Rate Limiting
  UPSTASH_REDIS_URL: z.string().url(),
  UPSTASH_REDIS_TOKEN: z.string().min(1),
  MAX_REQUESTS_PER_MINUTE: z.coerce.number().default(60),

  // Security
  ALLOWED_ORIGIN: z.string().url().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(32),

  // Video Processing
  MAX_VIDEO_SIZE_MB: z.coerce.number().default(50),
  ALLOWED_VIDEO_TYPES: z.string().default('video/mp4,video/webm'),
  VIDEO_PROCESSING_TIMEOUT_SEC: z.coerce.number().default(30),

  // CDN
  NEXT_PUBLIC_CDN_URL: z.string().url().optional(),
  CDN_API_KEY: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  ENABLE_PERFORMANCE_MONITORING: z.coerce.boolean().default(true),
  ERROR_ALERT_THRESHOLD: z.coerce.number().default(5),
  LATENCY_ALERT_THRESHOLD_MS: z.coerce.number().default(5000),

  // Demo Mode
  DEMO_MODE: z.coerce.boolean().default(false),
  PERFECT_FORM_VIDEOS_PATH: z.string().default('/demos/perfect-form/'),
  MAX_DEMO_REQUESTS_PER_IP: z.coerce.number().default(100),

  // Cache
  REDIS_CACHE_TTL_SECONDS: z.coerce.number().default(3600),
  ENABLE_RESPONSE_CACHE: z.coerce.boolean().default(true),
  CACHE_EXCLUDED_ROUTES: z.string().default('/api/analyze,/api/upload'),

  // API Limits
  MAX_CONCURRENT_UPLOADS: z.coerce.number().default(3),
  UPLOAD_TIMEOUT_SECONDS: z.coerce.number().default(30),

  // Database
  DB_POOL_SIZE: z.coerce.number().default(20),
  DB_IDLE_TIMEOUT_SECONDS: z.coerce.number().default(30),
  DB_CONNECTION_TIMEOUT_SECONDS: z.coerce.number().default(5),

  // Feature Flags
  ENABLE_VIDEO_PREPROCESSING: z.coerce.boolean().default(true),
  ENABLE_REAL_TIME_ANALYSIS: z.coerce.boolean().default(true),
  ENABLE_BATCH_PROCESSING: z.coerce.boolean().default(false),
});

// Process environment variables
const processEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
  UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN,
  MAX_REQUESTS_PER_MINUTE: process.env.MAX_REQUESTS_PER_MINUTE,
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
  JWT_SECRET: process.env.JWT_SECRET,
  MAX_VIDEO_SIZE_MB: process.env.MAX_VIDEO_SIZE_MB,
  ALLOWED_VIDEO_TYPES: process.env.ALLOWED_VIDEO_TYPES,
  VIDEO_PROCESSING_TIMEOUT_SEC: process.env.VIDEO_PROCESSING_TIMEOUT_SEC,
  NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
  CDN_API_KEY: process.env.CDN_API_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING,
  ERROR_ALERT_THRESHOLD: process.env.ERROR_ALERT_THRESHOLD,
  LATENCY_ALERT_THRESHOLD_MS: process.env.LATENCY_ALERT_THRESHOLD_MS,
  DEMO_MODE: process.env.DEMO_MODE,
  PERFECT_FORM_VIDEOS_PATH: process.env.PERFECT_FORM_VIDEOS_PATH,
  MAX_DEMO_REQUESTS_PER_IP: process.env.MAX_DEMO_REQUESTS_PER_IP,
  REDIS_CACHE_TTL_SECONDS: process.env.REDIS_CACHE_TTL_SECONDS,
  ENABLE_RESPONSE_CACHE: process.env.ENABLE_RESPONSE_CACHE,
  CACHE_EXCLUDED_ROUTES: process.env.CACHE_EXCLUDED_ROUTES,
  MAX_CONCURRENT_UPLOADS: process.env.MAX_CONCURRENT_UPLOADS,
  UPLOAD_TIMEOUT_SECONDS: process.env.UPLOAD_TIMEOUT_SECONDS,
  DB_POOL_SIZE: process.env.DB_POOL_SIZE,
  DB_IDLE_TIMEOUT_SECONDS: process.env.DB_IDLE_TIMEOUT_SECONDS,
  DB_CONNECTION_TIMEOUT_SECONDS: process.env.DB_CONNECTION_TIMEOUT_SECONDS,
  ENABLE_VIDEO_PREPROCESSING: process.env.ENABLE_VIDEO_PREPROCESSING,
  ENABLE_REAL_TIME_ANALYSIS: process.env.ENABLE_REAL_TIME_ANALYSIS,
  ENABLE_BATCH_PROCESSING: process.env.ENABLE_BATCH_PROCESSING,
};

// Validate and export environment configuration
export const env = envSchema.parse(processEnv);

// Export types
export type Env = z.infer<typeof envSchema>;

// Helper functions
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Feature flag checks
export const featureFlags = {
  videoPreprocessing: env.ENABLE_VIDEO_PREPROCESSING,
  realTimeAnalysis: env.ENABLE_REAL_TIME_ANALYSIS,
  batchProcessing: env.ENABLE_BATCH_PROCESSING,
  responseCache: env.ENABLE_RESPONSE_CACHE,
  performanceMonitoring: env.ENABLE_PERFORMANCE_MONITORING,
  demoMode: env.DEMO_MODE,
} as const;

// Cache configuration
export const cacheConfig = {
  ttl: env.REDIS_CACHE_TTL_SECONDS,
  excludedRoutes: env.CACHE_EXCLUDED_ROUTES.split(','),
} as const;

// API limits
export const apiLimits = {
  requestsPerMinute: env.MAX_REQUESTS_PER_MINUTE,
  concurrentUploads: env.MAX_CONCURRENT_UPLOADS,
  uploadTimeout: env.UPLOAD_TIMEOUT_SECONDS * 1000, // Convert to milliseconds
  videoSizeLimit: env.MAX_VIDEO_SIZE_MB * 1024 * 1024, // Convert to bytes
  allowedVideoTypes: env.ALLOWED_VIDEO_TYPES.split(','),
} as const;

// Monitoring thresholds
export const monitoringThresholds = {
  error: env.ERROR_ALERT_THRESHOLD,
  latency: env.LATENCY_ALERT_THRESHOLD_MS,
} as const;

// Database configuration
export const dbConfig = {
  poolSize: env.DB_POOL_SIZE,
  idleTimeout: env.DB_IDLE_TIMEOUT_SECONDS,
  connectionTimeout: env.DB_CONNECTION_TIMEOUT_SECONDS,
} as const; 