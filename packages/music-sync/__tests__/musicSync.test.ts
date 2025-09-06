import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
let metronomeInstances: any[] = [];
vi.mock('../src/metronome', () => {
  return {
    Metronome: vi.fn().mockImplementation((cfg: any) => {
      let intervalId: any = null;
      const inst = {
        start: vi.fn(() => {
          const intervalMs = (60 / cfg.bpm) * 1000;
          intervalId = setInterval(() => cfg.onBeat?.(), intervalMs);
        }),
        stop: vi.fn(() => {
          if (intervalId) { clearInterval(intervalId); intervalId = null; }
        }),
        setBpm: vi.fn((bpm: number) => {
          cfg.bpm = bpm;
          if (intervalId) {
            clearInterval(intervalId);
            const intervalMs = (60 / cfg.bpm) * 1000;
            intervalId = setInterval(() => cfg.onBeat?.(), intervalMs);
          }
        }),
        setVolume: vi.fn(),
      };
      metronomeInstances.push(inst);
      return inst as any;
    })
  };
});
import { MusicSync, TempoSegment } from '../src/musicSync';
import { Metronome } from '../src/metronome';
import { syncRepsToBeats, calculateTimingScore } from '../src/bpmSync';

describe('Music Synchronization', () => {
  let musicSync: MusicSync;
  let mockMetronome: any;

  beforeEach(() => {
    vi.useFakeTimers();
    metronomeInstances = [];
    // instantiate once to have a mock object reference shape
    mockMetronome = new (Metronome as any)({ bpm: 120 });
    musicSync = new MusicSync({ defaultBpm: 120 });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('initializes with default BPM', () => {
      musicSync.start();
      const ctorCalls = (Metronome as any).mock.calls;
      expect(ctorCalls.length).toBeGreaterThan(0);
      expect(ctorCalls[0][0].bpm).toBe(120);
    });

    it('handles BPM changes', () => {
      musicSync.start();
      const inst = metronomeInstances[metronomeInstances.length - 1];
      expect(inst).toBeTruthy();
      inst.setBpm.mockClear();
      musicSync.setBpm(140);
      expect(inst.setBpm).toHaveBeenCalledWith(140);
    });

    it('starts and stops correctly', () => {
      musicSync.start();
      const inst = metronomeInstances[metronomeInstances.length - 1];
      expect(inst.start).toHaveBeenCalled();

      musicSync.stop();
      expect(inst.stop).toHaveBeenCalled();
    });
  });

  describe('Tempo Segments', () => {
    const segments: TempoSegment[] = [
      { startMs: 0, endMs: 1000, bpm: 120 },
      { startMs: 1000, endMs: 2000, bpm: 140 },
      { startMs: 2000, endMs: 3000, bpm: 100 },
    ];

    it('handles tempo changes correctly', () => {
      musicSync.setTempoSegments(segments);
      musicSync.start();
      const inst = metronomeInstances[metronomeInstances.length - 1];
      // Initial tempo
      expect(inst.setBpm).toHaveBeenCalledWith(120);
      
      // Advance to second segment
      inst.setBpm.mockClear();
      vi.advanceTimersByTime(1100);
      expect(inst.setBpm).toHaveBeenCalledWith(140);
      
      // Advance to third segment
      inst.setBpm.mockClear();
      vi.advanceTimersByTime(1000);
      expect(inst.setBpm).toHaveBeenCalledWith(100);
    });

    it('passes onBeat callback to metronome', () => {
      const onBeat = vi.fn();
      musicSync = new MusicSync({ defaultBpm: 120, onBeat });
      musicSync.setTempoSegments(segments);
      musicSync.start();
      const ctorCalls = (Metronome as any).mock.calls;
      expect(ctorCalls.length).toBeGreaterThan(0);
      const last = ctorCalls[ctorCalls.length - 1][0];
      expect(last.onBeat).toBe(onBeat);
    });
  });

  describe('Rep Synchronization', () => {
    it('accurately syncs reps to constant tempo', () => {
      const bpm = 120; // 500ms per beat
      const repTimestamps = [
        { concentric: 500, eccentric: 1000 },   // Perfect timing
        { concentric: 1510, eccentric: 2010 },  // Slightly late
        { concentric: 2490, eccentric: 2990 },  // Slightly early
      ];

      const timing = syncRepsToBeats(repTimestamps, bpm);
      expect(timing).toHaveLength(6); // 3 reps * 2 phases

      // Check timing differences (allow minor rounding drift)
      expect(Math.abs(timing[0].diffMs)).toBeLessThanOrEqual(1);
      expect(Math.abs(timing[1].diffMs)).toBeLessThanOrEqual(1);
      expect(Math.abs(timing[2].diffMs - 10)).toBeLessThanOrEqual(1);
      expect(Math.abs(timing[3].diffMs - 10)).toBeLessThanOrEqual(1);
      expect(Math.abs(timing[4].diffMs + 10)).toBeLessThanOrEqual(1);
      expect(Math.abs(timing[5].diffMs + 10)).toBeLessThanOrEqual(1);

      // Calculate score
      const score = calculateTimingScore(timing);
      expect(score).toBeGreaterThan(90); // High score for small timing differences
    });

    it('handles variable tempo accurately', () => {
      const segments: TempoSegment[] = [
        { startMs: 0, endMs: 2000, bpm: 120 },    // 500ms per beat
        { startMs: 2000, endMs: 4000, bpm: 140 }, // ~429ms per beat
      ];

      const repTimestamps = [
        { concentric: 500, eccentric: 1000 },   // First segment, perfect
        { concentric: 1500, eccentric: 2000 },  // First segment, perfect
        { concentric: 2429, eccentric: 2858 },  // Second segment, perfect
        { concentric: 3287, eccentric: 3716 },  // Second segment, perfect
      ];

      // Test first segment
      const timing1 = syncRepsToBeats(
        repTimestamps.slice(0, 2),
        segments[0].bpm
      );
      expect(timing1).toHaveLength(4);
      timing1.forEach(t => expect(Math.abs(t.diffMs)).toBeLessThanOrEqual(2));

      // Test second segment
      const timing2 = syncRepsToBeats(
        repTimestamps.slice(2),
        segments[1].bpm
      );
      expect(timing2).toHaveLength(4);
      timing2.forEach(t => expect(Math.abs(t.diffMs)).toBeLessThanOrEqual(2));
    });

    it('calculates timing scores correctly', () => {
      const perfectTiming = [
        { repIdx: 0, phase: 'concentric' as const, diffMs: 0 },
        { repIdx: 0, phase: 'eccentric' as const, diffMs: 0 },
      ];
      expect(calculateTimingScore(perfectTiming)).toBe(100);

      const goodTiming = [
        { repIdx: 0, phase: 'concentric' as const, diffMs: 25 },
        { repIdx: 0, phase: 'eccentric' as const, diffMs: -25 },
      ];
      expect(calculateTimingScore(goodTiming)).toBe(100);

      const okayTiming = [
        { repIdx: 0, phase: 'concentric' as const, diffMs: 75 },
        { repIdx: 0, phase: 'eccentric' as const, diffMs: -75 },
      ];
      expect(calculateTimingScore(okayTiming)).toBeLessThan(100);
      expect(calculateTimingScore(okayTiming)).toBeGreaterThan(50);

      const poorTiming = [
        { repIdx: 0, phase: 'concentric' as const, diffMs: 150 },
        { repIdx: 0, phase: 'eccentric' as const, diffMs: -150 },
      ];
      expect(calculateTimingScore(poorTiming)).toBeLessThan(50);

      const failedTiming = [
        { repIdx: 0, phase: 'concentric' as const, diffMs: 250 },
        { repIdx: 0, phase: 'eccentric' as const, diffMs: -250 },
      ];
      expect(calculateTimingScore(failedTiming)).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles missing beats gracefully', () => {
      const timing = syncRepsToBeats([], 120);
      expect(timing).toEqual([]);
      expect(calculateTimingScore(timing)).toBe(0);
    });

    it('handles invalid BPM values', () => {
      const repTimestamps = [
        { concentric: 500, eccentric: 1000 },
      ];

      expect(() => syncRepsToBeats(repTimestamps, 0)).not.toThrow();
      expect(() => syncRepsToBeats(repTimestamps, -120)).not.toThrow();
      expect(() => syncRepsToBeats(repTimestamps, NaN)).not.toThrow();
    });

    it('recovers from timing drift', () => {
      const onBeat = vi.fn();
      musicSync = new MusicSync({ defaultBpm: 120, onBeat });
      musicSync.start();

      // Simulate system lag
      vi.advanceTimersByTime(510); // 10ms late
      expect(onBeat).toHaveBeenCalledTimes(1);

      // Next beat should adjust
      vi.advanceTimersByTime(490); // Compensate for lag
      expect(onBeat).toHaveBeenCalledTimes(2);

      // Back to normal timing
      vi.advanceTimersByTime(500);
      expect(onBeat).toHaveBeenCalledTimes(3);
    });
  });
}); 