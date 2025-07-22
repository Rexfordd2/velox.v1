import { Pose } from "../types/pose";
export function analyzeSideSquat(frames: Pose[]) {
  // simple sagittal-plane rules (placeholder thresholds)
  // back angle relative to vertical - using hip and shoulder landmarks
  const backAngles = frames.map(f => {
    const hip = f.landmarks.leftHip || f.landmarks.rightHip;
    const shoulder = f.landmarks.leftShoulder || f.landmarks.rightShoulder;
    if (!hip || !shoulder) return 0;
    const angle = Math.atan2(shoulder.y - hip.y, shoulder.x - hip.x) * (180 / Math.PI);
    return Math.abs(90 - angle); // Deviation from vertical
  });
  const maxLean = Math.max(...backAngles);
  const errors = [];
  if (maxLean > 40) errors.push("Back lean too large");
  const score = Math.max(0, 100 - maxLean);
  return { score, majorErrors: errors, minorErrors: [] };
} 