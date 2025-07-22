import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const progressRouter = router({
  get: protectedProcedure
    .input(z.object({
      movement: z.string(),
      weeks: z.number().min(4).max(52).default(12),
    }))
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      const { data, error } = await supabase
        .from("weekly_progress")
        .select("week_start,best_velocity")
        .eq("user_id", user.id)
        .eq("movement_id", input.movement)
        .order("week_start", { ascending: true })
        .limit(input.weeks);

      if (error) throw new Error(error.message);

      const labels = data.map((d) =>
        new Date(d.week_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      );
      const values = data.map((d) => d.best_velocity);
      return { labels, values };
    }),
}); 