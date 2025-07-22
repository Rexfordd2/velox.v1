import { Frame } from "./types";

export type RepMetric = {
  peakVel: number;
  rom: number;               // degrees hip-knee-ankle stack
  tempo: { ecc: number; con: number }; // ms
  score: number;             // 0-100 quality
};

/** naive calc: assumes frames array is one rep, fps known */
export function calcRepMetrics(frames: Frame[]): { velocity: number; confidence: number } {
  const velocity = /* existing calc */;
  
  // confidence: 1 – (std-dev of hipY / mean hipY)  → clamp 0..1
  const hipYs = frames.map(f => f.keypoints.hip.y);
  const μ = hipYs.reduce((a, b) => a + b, 0) / hipYs.length;
  const σ = Math.sqrt(hipYs.reduce((s, y) => s + (y - μ) ** 2, 0) / hipYs.length);
  const jitter = σ / μ;                  // 0 = perfect
  const conf = Math.max(0, Math.min(1, 1 - jitter * 5)); // scale factor
  
  return { velocity, confidence: conf };
} 