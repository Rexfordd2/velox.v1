import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MusicSync, TempoSegment } from '../src/musicSync';
import { Metronome } from '../src/metronome';
import { syncRepsToBeats, calculateTimingScore } from '../src/bpmSync';

// Mock Metronome
jest.mock('../src/metronome');

describe('Music Synchronization', () => {
  let musicSync: MusicSync;
  let mockMetronome: jest.Mocked<Metronome>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockMetronome = new Metronome({}) as jest.Mocked<Metronome>;
    (Metronome as jest.Mock).mockImplementation(() => mockMetronome);
    musicSync = new MusicSync({ defaultBpm: 120 });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('initializes with default BPM', () => {
      expect(mockMetronome.setBpm).toHaveBeenCalledWith(120);
    });

    it('handles BPM changes', () => {
      musicSync.setBpm(140);
      expect(mockMetronome.setBpm).toHaveBeenCalledWith(140);
    });

    it('starts and stops correctly', () => {
      musicSync.start();
      expect(mockMetronome.start).toHaveBeenCalled();

      musicSync.stop();
      expect(mockMetronome.stop).toHaveBeenCalled();
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

      // Initial tempo
      expect(mockMetronome.setBpm).toHaveBeenCalledWith(120);

      // Advance to second segment
      jest.advanceTimersByTime(1100);
      expect(mockMetronome.setBpm).toHaveBeenCalledWith(140);

      // Advance to third segment
      jest.advanceTimersByTime(1000);
      expect(mockMetronome.setBpm).toHaveBeenCalledWith(100);
    });

    it('maintains timing accuracy during tempo changes', () => {
      const onBeat = jest.fn();
      musicSync = new MusicSync({ defaultBpm: 120, onBeat });
      musicSync.setTempoSegments(segments);
      musicSync.start();

      // Check beat timing in first segment (120 BPM = 500ms per beat)
      jest.advanceTimersByTime(500);
      expect(onBeat).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      expect(onBeat).toHaveBeenCalledTimes(2);

      // Check beat timing in second segment (140 BPM ≈ 429ms per beat)
      jest.advanceTimersByTime(429);
      expect(onBeat).toHaveBeenCalledTimes(3);
      jest.advanceTimersByTime(429);
      expect(onBeat).toHaveBeenCalledTimes(4);
    });
  });

  describe('Rep Synchronization', () => {
    it('accurately syncs reps to constant tempo', () => {
      const bpm = 120; // 500ms per beat
      const fps = 30;
      const repTimestamps = [
        { concentric: 500, eccentric: 1000 },   // Perfect timing
        { concentric: 1510, eccentric: 2010 },  // Slightly late
        { concentric: 2490, eccentric: 2990 },  // Slightly early
      ];

      const timing = syncRepsToBeats(repTimestamps, bpm);
      expect(timing).toHaveLength(6); // 3 reps * 2 phases

      // Check timing differences
      expect(timing[0].diffMs).toBe(0);    // Perfect
      expect(timing[1].diffMs).toBe(0);    // Perfect
      expect(timing[2].diffMs).toBe(10);   // 10ms late
      expect(timing[3].diffMs).toBe(10);   // 10ms late
      expect(timing[4].diffMs).toBe(-10);  // 10ms early
      expect(timing[5].diffMs).toBe(-10);  // 10ms early

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
      timing1.forEach(t => expect(Math.abs(t.diffMs)).toBeLessThanOrEqual(1));

      // Test second segment
      const timing2 = syncRepsToBeats(
        repTimestamps.slice(2),
        segments[1].bpm
      );
      expect(timing2).toHaveLength(4);
      timing2.forEach(t => expect(Math.abs(t.diffMs)).toBeLessThanOrEqual(1));
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
      const onBeat = jest.fn();
      musicSync = new MusicSync({ defaultBpm: 120, onBeat });
      musicSync.start();

      // Simulate system lag
      jest.advanceTimersByTime(510); // 10ms late
      expect(onBeat).toHaveBeenCalledTimes(1);

      // Next beat should adjust
      jest.advanceTimersByTime(490); // Compensate for lag
      expect(onBeat).toHaveBeenCalledTimes(2);

      // Back to normal timing
      jest.advanceTimersByTime(500);
      expect(onBeat).toHaveBeenCalledTimes(3);
    });
  });
}); 