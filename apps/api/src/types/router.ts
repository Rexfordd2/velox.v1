import { inferRouterOutputs, inferRouterInputs } from '@trpc/server';
import { profileRouter } from '../routers/profile';

// Infer router output types
export type ProfileRouterOutput = inferRouterOutputs<typeof profileRouter>;

// Export specific endpoint types
export type GetMeOutput = ProfileRouterOutput['getMe'];
export type UpdateProfileOutput = ProfileRouterOutput['updateProfile'];
export type UploadPDFOutput = ProfileRouterOutput['uploadPDF'];
export type GetSavedWorkoutsOutput = ProfileRouterOutput['getSavedWorkouts']; 