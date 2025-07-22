import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { revalidateTag } from '../utils/cache';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// Input validation schemas
const infiniteFeedSchema = z.object({
  limit: z.number().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  cursor: z.string().optional(),
});

const createPostSchema = z.object({
  content: z.string().min(1).max(500),
  workoutId: z.string().uuid().optional(),
});

const createCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(500),
});

export const postsRouter = createTRPCRouter({
  getInfiniteFeed: protectedProcedure
    .input(infiniteFeedSchema)
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;
      const { limit, cursor } = input;

      const query = supabase
        .from('posts')
        .select(`
          *,
          user:users (
            id,
            username,
            avatar_url
          ),
          workout:workouts (
            id,
            title,
            description
          ),
          _count: comments (count)
        `)
        .order('created_at', { ascending: false })
        .limit(limit + 1); // Fetch one extra to determine if there are more

      // Apply cursor if provided
      if (cursor) {
        query.lt('created_at', cursor);
      }

      const { data: posts, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch posts',
          cause: error,
        });
      }

      let nextCursor: string | undefined = undefined;
      if (posts && posts.length > limit) {
        const nextItem = posts.pop(); // Remove the extra item
        nextCursor = nextItem?.created_at;
      }

      return {
        posts: posts || [],
        nextCursor,
      };
    }),

  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      const { content, workoutId } = input;

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          workout_id: workoutId,
        })
        .select(`
          *,
          user:users (
            id,
            username,
            avatar_url
          ),
          workout:workouts (
            id,
            title,
            description
          )
        `)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create post',
          cause: error,
        });
      }

      // Invalidate the feed cache
      await revalidateTag('feed');

      return post;
    }),

  comment: protectedProcedure
    .input(createCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      const { postId, content } = input;

      // First verify the post exists
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .single();

      if (postError || !post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          post_id: postId,
          content,
        })
        .select(`
          *,
          user:users (
            id,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create comment',
          cause: error,
        });
      }

      // Invalidate the feed cache
      await revalidateTag('feed');

      return comment;
    }),
}); 