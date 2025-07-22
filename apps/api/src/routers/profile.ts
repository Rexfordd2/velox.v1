import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { MusicService } from '../types/enums';

// Input validation schemas
const updateProfileSchema = z.object({
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  goals: z.record(z.any()).optional(), // jsonb in database
  musicService: z.enum(['spotify', 'apple', 'none'] as const).optional(),
});

const uploadPDFSchema = z.object({
  fileName: z.string(),
  fileSize: z.number(),
  contentType: z.string(),
});

const settingsSchema = z.object({
  notifications: z.object({
    workoutReminders: z.boolean(),
    achievementAlerts: z.boolean(),
    weeklyProgress: z.boolean(),
  }),
  camera: z.object({
    quality: z.enum(['low', 'medium', 'high']),
    frameRate: z.enum(['30', '60']),
  }),
  privacy: z.object({
    shareProgress: z.boolean(),
    publicProfile: z.boolean(),
  }),
});

export const profileRouter = createTRPCRouter({
  getMe: protectedProcedure
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx;
      
      // Get user profile with related data
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
          *,
          user_settings (*),
          user_badges (
            badges (
              id,
              name,
              description,
              image_url
            )
          ),
          workout_count: workout_sessions (count),
          total_exercise_minutes: workout_sessions (sum(duration))
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch profile',
          cause: profileError,
        });
      }

      return profile;
    }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      const { musicService, ...profileData } = input;

      // Start a transaction
      const { data, error } = await supabase.rpc('update_profile_tx', {
        p_user_id: user.id,
        p_profile_data: profileData,
        p_music_service: musicService,
      });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
          cause: error,
        });
      }

      return data;
    }),

  uploadPDF: protectedProcedure
    .input(uploadPDFSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      const { fileName, fileSize, contentType } = input;

      // Generate a unique file path
      const filePath = `${user.id}/${Date.now()}-${fileName}`;

      // Get upload URL from Supabase Storage
      const { data: { signedUrl }, error: urlError } = await supabase
        .storage
        .from('pdf-uploads')
        .createSignedUploadUrl(filePath);

      if (urlError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate upload URL',
          cause: urlError,
        });
      }

      // Insert record into pdf_uploads table
      const { data: pdfRecord, error: insertError } = await supabase
        .from('pdf_uploads')
        .insert({
          user_id: user.id,
          file_name: fileName,
          file_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pdf-uploads/${filePath}`,
          file_size: fileSize,
        })
        .select()
        .single();

      if (insertError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record PDF upload',
          cause: insertError,
        });
      }

      return {
        uploadUrl: signedUrl,
        pdfRecord,
      };
    }),

  updateSettings: protectedProcedure
    .input(settingsSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // Update user settings
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notifications: input.notifications,
          camera_settings: input.camera,
          privacy_settings: input.privacy,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update settings',
          cause: error,
        });
      }

      return { success: true };
    }),

  getSavedWorkouts: protectedProcedure
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx;

      const { data: savedWorkouts, error } = await supabase
        .from('saved_workouts')
        .select(`
          *,
          workout:workouts (
            id,
            title,
            description,
            duration,
            spotify_track_id,
            created_at,
            workout_sets (
              movement:movements (
                id,
                name,
                description,
                difficulty_level
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch saved workouts',
          cause: error,
        });
      }

      return savedWorkouts;
    }),
}); 