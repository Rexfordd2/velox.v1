import { Pose } from "../types/pose";
export function analyzeFrontSquat(frames: Pose[]) {
  // existing checks (valgus, depth, etc.)
  return { score: 80, majorErrors: [], minorErrors: [] };
} 