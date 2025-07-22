import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const deviceSettingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .from("device_settings")
      .select("px_per_meter")
      .eq("user_id", ctx.auth.userId)
      .single();
  }),
  set: protectedProcedure
    .input(z.object({ pxPerMeter: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.db
        .from("device_settings")
        .upsert({
          user_id: ctx.auth.userId,
          px_per_meter: input.pxPerMeter,
        });
      if (error) throw error;
    }),
}); 