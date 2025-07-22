import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { buildLeaderboard, type LeaderboardEntry } from '../../../../packages/core/leaderboard';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

const leaderboardInputSchema = z.object({
  movementId: z.string().uuid(),
  window: z.enum(['week', 'month']),
});

export const leaderboardsRouter = createTRPCRouter({
  getGlobal: publicProcedure
    .input(leaderboardInputSchema)
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;
      const { movementId, window } = input;

      // Try to get from cache first
      const { data: cached, error: cacheError } = await supabase
        .from('leaderboards_cache')
        .select('payload, created_at')
        .eq('movement_id', movementId)
        .eq('window', window)
        .eq('scope', 'global')
        .is('generated_for', null)
        .single();

      // Check if cache is valid (less than 10 minutes old)
      if (cached && !cacheError) {
        const cacheAge = Date.now() - new Date(cached.created_at).getTime();
        if (cacheAge < CACHE_TTL) {
          return cached.payload as LeaderboardEntry[];
        }
      }

      // Cache miss or stale, build new leaderboard
      const leaderboard = await buildLeaderboard({
        movementId,
        window,
        scope: 'global',
        userId: '', // Not needed for global scope
      });

      // Update cache
      await supabase
        .from('leaderboards_cache')
        .upsert({
          movement_id: movementId,
          window,
          scope: 'global',
          generated_for: null,
          payload: leaderboard,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'movement_id,window,scope,generated_for',
        });

      return leaderboard;
    }),

  getFriends: protectedProcedure
    .input(leaderboardInputSchema)
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      const { movementId, window } = input;

      // Try to get from cache first
      const { data: cached, error: cacheError } = await supabase
        .from('leaderboards_cache')
        .select('payload, created_at')
        .eq('movement_id', movementId)
        .eq('window', window)
        .eq('scope', 'friends')
        .eq('generated_for', user.id)
        .single();

      // Check if cache is valid (less than 10 minutes old)
      if (cached && !cacheError) {
        const cacheAge = Date.now() - new Date(cached.created_at).getTime();
        if (cacheAge < CACHE_TTL) {
          return cached.payload as LeaderboardEntry[];
        }
      }

      // Cache miss or stale, build new leaderboard
      const leaderboard = await buildLeaderboard({
        movementId,
        window,
        scope: 'friends',
        userId: user.id,
      });

      // Update cache
      await supabase
        .from('leaderboards_cache')
        .upsert({
          movement_id: movementId,
          window,
          scope: 'friends',
          generated_for: user.id,
          payload: leaderboard,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'movement_id,window,scope,generated_for',
        });

      return leaderboard;
    }),
}); 