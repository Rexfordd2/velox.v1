import { BeatTiming } from "./alignRepsToBeats";

export function calculateTimingScore(
  timings: BeatTiming[],
  tolerance = 50
): number {
  if (!timings.length) return 0;
  const score = timings.reduce((acc, t) => {
    const diff = Math.abs(t.diffMs);
    if (diff <= tolerance) return acc + 100;
    if (diff >= tolerance * 4) return acc;      // beyond 200 ms ⇒ 0
    // steeper drop-off between tolerance and 4× tolerance
    const pct = Math.pow(1 - (diff - tolerance) / (tolerance * 3), 2);
    return acc + pct * 100;
  }, 0);
  return Math.round(score / timings.length);
}

export function getBeatTimings(reps: number[], beats: number[]): BeatTiming[] {
  return alignRepsToBeats(
    reps.map(t => ({ t })),
    beats.map(t => ({ t }))
  ).map((v, i) => ({ repTime: reps[i], beatTime: reps[i] - v.diffMs, diffMs: v.diffMs }));
} 