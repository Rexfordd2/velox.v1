import { router } from "./trpc";
import { leaderboardRouter } from "./routers/leaderboard";
import { sessionsRouter } from "./routers/sessions";
import { progressRouter } from "./routers/progress";
import { deviceSettingsRouter } from "./routers/deviceSettings";

export const appRouter = router({
  leaderboard: leaderboardRouter,
  sessions: sessionsRouter,
  progress: progressRouter,
  device: deviceSettingsRouter,
});

export type AppRouter = typeof appRouter; 