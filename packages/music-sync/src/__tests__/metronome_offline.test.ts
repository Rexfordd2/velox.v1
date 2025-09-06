import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Metronome } from '../../src/metronome';

// Stub minimal WebAudio API used by Metronome
class FakeOscillator {
  type: OscillatorType = 'sine';
  frequency = { value: 440 } as any;
  start = vi.fn();
  stop = vi.fn();
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeGainNode {
  gain = { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } as any;
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeAudioContext {
  destination = {} as any;
  currentTime = 0;
  createOscillator() { return new FakeOscillator() as any; }
  createGain() { return new FakeGainNode() as any; }
}

describe('Metronome offline drift @ 90 BPM', () => {
  let realAudioContext: any;

  beforeEach(() => {
    vi.useFakeTimers();
    realAudioContext = (globalThis as any).AudioContext;
    (globalThis as any).AudioContext = FakeAudioContext as any;
    // Ensure window exists for window.setInterval in Metronome
    (globalThis as any).window = (globalThis as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    (globalThis as any).AudioContext = realAudioContext;
  });

  it('schedules ~1800 ticks in 30s with ≤1% drift', () => {
    const bpm = 90; // 666.666... ms per beat
    const intervalMs = (60 / bpm) * 1000;
    const onBeat = vi.fn();
    const m = new Metronome({ bpm, onBeat, volume: 0 });

    m.start();

    // Advance 30 seconds in small steps to simulate regular scheduling
    const totalMs = 30000;
    const step = Math.round(intervalMs); // ~667ms per beat
    let elapsed = 0;
    while (elapsed < totalMs) {
      const adv = Math.min(step, totalMs - elapsed);
      vi.advanceTimersByTime(adv);
      elapsed += adv;
    }

    const expectedBeats = totalMs / intervalMs; // 45 beats
    const actualBeats = onBeat.mock.calls.length;
    const driftPct = Math.abs(actualBeats - expectedBeats) / expectedBeats;
    expect(driftPct).toBeLessThanOrEqual(0.01);

    m.stop();
  });
});


