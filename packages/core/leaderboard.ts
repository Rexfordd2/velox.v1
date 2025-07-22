import { createClient } from '@supabase/supabase-js';
import { Database } from './types/database';

export type LeaderboardScope = 'global' | 'friends';

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  username: string;
  best_score: number;
};

export async function buildLeaderboard(opts: {
  movementId: string;            // e.g. 'squat'
  window: 'week' | 'month';      // ISO week or calendar month
  scope: LeaderboardScope;       // 'global' | 'friends'
  userId: string;
}): Promise<
  { rank: number; user_id: string; username: string; best_score: number }[]
> {
  const { supabase } = await import("./supabase-client");

  const dateFilter =
    opts.window === "week"
      ? "date_trunc('week', recorded_at)"
      : "date_trunc('month', recorded_at)";

  const base = `
    select
      user_id,
      max(score) as best_score
    from movement_scores
    where movement_id = $1
      and ${dateFilter} = ${dateFilter}  -- ensures index use
    group by user_id
  `;

  const friendsJoin =
    opts.scope === "friends"
      ? `inner join friendships f on f.friend_id = user_id
         where f.user_id = $2 and f.status = 'accepted'`
      : "";

  const sql = `
    with ranked as (
      select
        row_number() over (order by best_score desc) as rank,
        user_id,
        best_score
      from (${base} ${friendsJoin}) t
    )
    select r.rank, r.user_id, p.username, r.best_score
    from ranked r
    join profiles p on p.id = r.user_id
    order by rank
    limit 100;
  `;

  const { data, error } = await supabase.rpc("exec_sql", {
    sql,
    params:
      opts.scope === "friends"
        ? [opts.movementId, opts.userId]
        : [opts.movementId],
  });
  if (error) throw error;
  return data as any;
} 