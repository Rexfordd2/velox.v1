import { useCallback } from 'react';
import { trpc } from '../../../apps/web/app/_trpc/client';
import type { LeaderboardEntry } from '../../core/leaderboard';

export type LeaderboardWindow = 'week' | 'month';
export type LeaderboardScope = 'global' | 'friends';

interface UseLeaderboardOptions {
  /** Optional initial data to use while loading */
  initialData?: LeaderboardEntry[];
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
}

/**
 * Hook to fetch leaderboard data with caching
 * @param movementId - The movement to get leaderboard for
 * @param window - Time window ('week' or 'month')
 * @param scope - Leaderboard scope ('global' or 'friends')
 * @param options - Additional options for the query
 */
export function useLeaderboard(
  movementId: string,
  window: LeaderboardWindow,
  scope: LeaderboardScope,
  options: UseLeaderboardOptions = {}
) {
  const { initialData, enabled = true } = options;

  // Memoize the query key for stable reference
  const queryKey = useCallback(
    () => ({ movementId, window }),
    [movementId, window]
  );

  // Use the appropriate query based on scope
  const query = scope === 'global'
    ? trpc.leaderboards.getGlobal.useQuery(queryKey(), {
        initialData,
        enabled,
      })
    : trpc.leaderboards.getFriends.useQuery(queryKey(), {
        initialData,
        enabled,
      });

  return {
    ...query,
    /** The current leaderboard entries */
    entries: query.data || [],
    /** Whether this is the user's friends leaderboard */
    isFriendsLeaderboard: scope === 'friends',
    /** The selected time window */
    timeWindow: window,
    /** Helper to check if a user ID is in the top 3 */
    isTopThree: useCallback((userId: string) => {
      const entry = query.data?.find(e => e.user_id === userId);
      return entry ? entry.rank <= 3 : false;
    }, [query.data]),
    /** Get a user's rank, or undefined if not ranked */
    getUserRank: useCallback((userId: string) => {
      return query.data?.find(e => e.user_id === userId)?.rank;
    }, [query.data]),
  };
} 