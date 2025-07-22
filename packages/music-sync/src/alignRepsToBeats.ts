import { Beat, Rep } from "./types";

export interface BeatTiming {
  rep: Rep;
  beat: Beat;
  diffMs: number;      // positive = rep after beat
  inWindow: boolean;
}

export function alignRepsToBeats(
  reps: Rep[],
  beats: Beat[],
  opts: { camLatency: number; audioLatency: number; tolerance: number } = {
    camLatency: 0,
    audioLatency: 0,
    tolerance: 50,
  }
): BeatTiming[] {
  const { camLatency, audioLatency, tolerance } = opts;
  const timings: BeatTiming[] = [];

  beats.forEach((beat) => {
    // find nearest rep timestamp (after latency compensation)
    let nearest: Rep | undefined;
    let minDiff = Infinity;
    reps.forEach((rep) => {
      const adjRep = rep.timestamp - camLatency;
      const adjBeat = beat.timestamp - audioLatency;
      const diff = Math.abs(adjRep - adjBeat);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = rep;
      }
    });
    if (nearest) {
      const diffMs = (nearest.timestamp - camLatency) - (beat.timestamp - audioLatency);
      timings.push({
        rep: nearest,
        beat,
        diffMs,
        inWindow: Math.abs(diffMs) <= tolerance,
      });
    }
  });

  return timings;
} 