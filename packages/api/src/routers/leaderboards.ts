import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

const input = z.object({
  movement: z.string(),
  window: z.enum(["week", "month"]),
});

export const leaderboardRouter = router({
  // 1. Global leaderboard
  getGlobal: publicProcedure.input(input).query(async ({ ctx, input }) => {
    const { supabase } = ctx;
    const since =
      input.window === "week"
        ? "now() - interval '7 days'"
        : "now() - interval '30 days'";

    const { data, error } = await supabase
      .from("movement_scores")
      .select("user_id, score, profiles(username)")
      .eq("movement_id", input.movement)
      .gte("created_at", supabase.rpc("sql", { script: since })) // simple date filter
      .order("score", { ascending: false });

    if (error) throw error;

    return data.map((r) => ({
      user_id: r.user_id,
      username: r.profiles.username,
      bestScore: r.score,
    }));
  }),

  // 2. Friends-only leaderboard
  getFriends: protectedProcedure.input(input).query(async ({ ctx, input }) => {
    const { supabase, session } = ctx;
    const userId = session.user.id;
    const since =
      input.window === "week"
        ? "now() - interval '7 days'"
        : "now() - interval '30 days'";

    // find friend IDs
    const { data: friends } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", userId);

    const ids = friends?.map((f) => f.friend_id) ?? [];

    const { data, error } = await supabase
      .from("movement_scores")
      .select("user_id, score, profiles(username)")
      .in("user_id", [...ids, userId]) // include self
      .eq("movement_id", input.movement)
      .gte("created_at", supabase.rpc("sql", { script: since }))
      .order("score", { ascending: false });

    if (error) throw error;

    return data.map((r) => ({
      user_id: r.user_id,
      username: r.profiles.username,
      bestScore: r.score,
    }));
  }),
}); 