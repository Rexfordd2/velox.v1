import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const sessionsRouter = router({
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // safety: verify ownership in SQL
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", input.id)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
      return { success: true };
    }),
}); 