export interface BeatTiming {
  repIdx: number;
  phase: 'concentric' | 'eccentric';
  diffMs: number;   // positive = late, negative = early
}

/**
 * Sync rep phases to music beats
 * @param repTimestamps Array of rep phase timestamps
 * @param bpm Beats per minute
 * @returns Array of timing differences between reps and beats
 */
export function syncRepsToBeats(
  repTimestamps: { concentric: number; eccentric: number }[],
  bpm: number
): BeatTiming[] {
  if (!repTimestamps.length || !bpm) {
    return [];
  }

  const beatInterval = (60 / bpm) * 1000; // Convert BPM to milliseconds
  const timing: BeatTiming[] = [];

  for (let i = 0; i < repTimestamps.length; i++) {
    const rep = repTimestamps[i];
    
    // Find nearest beat for concentric phase
    const concentricBeatCount = Math.round(rep.concentric / beatInterval);
    const concentricBeat = concentricBeatCount * beatInterval;
    const concentricDiff = rep.concentric - concentricBeat;
    
    timing.push({
      repIdx: i,
      phase: 'concentric',
      diffMs: concentricDiff
    });

    // Find nearest beat for eccentric phase
    const eccentricBeatCount = Math.round(rep.eccentric / beatInterval);
    const eccentricBeat = eccentricBeatCount * beatInterval;
    const eccentricDiff = rep.eccentric - eccentricBeat;
    
    timing.push({
      repIdx: i,
      phase: 'eccentric',
      diffMs: eccentricDiff
    });
  }

  return timing;
}

/**
 * Calculate timing score based on beat differences
 * @param timing Array of beat timing differences
 * @returns Score from 0-100
 */
export function calculateTimingScore(timing: BeatTiming[]): number {
  if (!timing.length) {
    return 0;
  }

  const perfectWindow = 50; // Perfect timing window in ms
  let totalScore = 0;

  for (const t of timing) {
    const absDiff = Math.abs(t.diffMs);
    if (absDiff > perfectWindow * 4) { // More than 200ms off is a complete miss
      return 0;
    }
    // Score decreases exponentially outside perfect window
    const score = absDiff <= perfectWindow 
      ? 100 
      : Math.round(100 * Math.exp(-(absDiff - perfectWindow) / 50));
    totalScore += score;
  }

  // Round to nearest integer
  return Math.round(totalScore / timing.length);
} 