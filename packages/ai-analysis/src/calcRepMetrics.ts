import { Frame } from "./types";

export type RepMetric = {
  peakVel: number;
  rom: number;               // degrees hip-knee-ankle stack
  tempo: { ecc: number; con: number }; // ms
  score: number;             // 0-100 quality
};

/** naive calc: assumes frames array is one rep, fps known */
export function calcRepMetrics(frames: any[], fps: number = 60): any {
  if (!frames || frames.length < 2) {
    return { peakVel: 0, rom: 0, tempo: { ecc: 0, con: 0 }, score: 0, velocity: 0, confidence: 0 };
  }
  const dt = 1 / fps;
  // Support legacy test shape where frames contain hipDepth and velocity fields
  const hasPose = frames[0]?.keypoints?.hip?.y != null;
  const hipYs = hasPose ? frames.map((f: any) => f.keypoints.hip.y) : frames.map((f: any) => f.hipDepth ?? 0);
  let sumVel = 0;
  for (let i = 1; i < hipYs.length; i++) sumVel += Math.abs((hipYs[i] - hipYs[i - 1]) / dt);
  const avgVel = sumVel / (hipYs.length - 1);

  // Peak concentric velocity from provided velocity field if present
  const peakVel = Math.max(...frames.map((f: any) => Math.abs(f.velocity ?? 0)));
  // ROM as delta of hip depth proxy
  const rom = Math.max(...hipYs) - Math.min(...hipYs);
  // Simple tempo assuming first half eccentric, second half concentric
  const half = Math.floor(frames.length / 2);
  const tempo = { ecc: half * dt * 1000, con: (frames.length - half) * dt * 1000 };
  // Score heuristic
  const score = Math.max(0, Math.min(100, 100 - (Math.abs(hipYs[0] - hipYs[hipYs.length - 1]) * 100)));

  // Confidence similar to prior
  const μ = hipYs.reduce((a: number, b: number) => a + b, 0) / hipYs.length;
  const σ = Math.sqrt(hipYs.reduce((s: number, y: number) => s + (y - μ) ** 2, 0) / hipYs.length);
  const jitter = μ ? σ / μ : 1;
  const confidence = Math.max(0, Math.min(1, 1 - jitter * 5));

  return { peakVel, rom, tempo, score, velocity: avgVel, confidence };
}