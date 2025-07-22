import { analyzeFrontSquat } from "./analyzers/frontSquat";
import { analyzeSideSquat } from "./analyzers/sideSquat";
import { Pose } from "./types/pose";

export function gradeFrame(frames: Pose[], exercise: string, view: "front" | "side" = "front") {
  if (exercise === "squat") {
    return view === "front"
      ? analyzeFrontSquat(frames)
      : analyzeSideSquat(frames);
  }
  // fallback …
} 