import { createTRPCRouter } from './trpc';
import { profileRouter } from './routers/profile';
import { postsRouter } from './routers/posts';
import { challengesRouter } from './routers/challenges';
import { workoutsRouter } from './routers/workouts';
import { movementsRouter } from './routers/movements';
import { leaderboardsRouter } from './routers/leaderboards';
import { customExercisesRouter } from './routers/customExercises';

export const appRouter = createTRPCRouter({
  profile: profileRouter,
  posts: postsRouter,
  challenges: challengesRouter,
  workouts: workoutsRouter,
  movements: movementsRouter,
  leaderboards: leaderboardsRouter,
  customExercises: customExercisesRouter,
});

export type AppRouter = typeof appRouter; 