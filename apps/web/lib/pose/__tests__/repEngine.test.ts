import { describe, it, expect } from '@jest/globals';
import { RepEngine } from '../../pose/repEngine';
import { selectTips } from '../../pose/tips';

function simulateRepSeries({
  reps,
  fps = 50,
  bottomHoldMs = 120,
  topHoldMs = 120,
  depthFlexDeg = 90,
}: {
  reps: number;
  fps?: number;
  bottomHoldMs?: number;
  topHoldMs?: number;
  depthFlexDeg?: number;
}) {
  const samples: { ts: number; kneeFlexDeg: number; hipFlexDeg: number; barY: number }[] = [];
  const frameMs = Math.round(1000 / fps);
  let ts = 0;
  for (let r = 0; r < reps; r++) {
    // top hold
    for (let i = 0; i < Math.max(1, Math.round(topHoldMs / frameMs)); i++) {
      samples.push({ ts, kneeFlexDeg: 10, hipFlexDeg: 10, barY: 0 });
      ts += frameMs;
    }
    // eccentric descent
    for (let i = 0; i < 20; i++) {
      const t = (i + 1) / 20;
      samples.push({ ts, kneeFlexDeg: 10 + t * (depthFlexDeg - 10), hipFlexDeg: 10 + t * (depthFlexDeg - 10), barY: i * 1 });
      ts += frameMs;
    }
    // bottom hold
    for (let i = 0; i < Math.max(1, Math.round(bottomHoldMs / frameMs)); i++) {
      samples.push({ ts, kneeFlexDeg: depthFlexDeg, hipFlexDeg: depthFlexDeg, barY: 20 });
      ts += frameMs;
    }
    // concentric ascent
    for (let i = 0; i < 20; i++) {
      const t = (i + 1) / 20;
      samples.push({ ts, kneeFlexDeg: depthFlexDeg - t * (depthFlexDeg - 10), hipFlexDeg: depthFlexDeg - t * (depthFlexDeg - 10), barY: 20 - i * 1 });
      ts += frameMs;
    }
    // ensure top hold after final rep so rep can finalize
    if (r === reps - 1) {
      for (let i = 0; i < Math.max(1, Math.round(topHoldMs / frameMs)); i++) {
        samples.push({ ts, kneeFlexDeg: 10, hipFlexDeg: 10, barY: 0 });
        ts += frameMs;
      }
    }
  }
  return samples;
}

describe('RepEngine', () => {
  it('counts reps accurately on smooth series', () => {
    const engine = new RepEngine('balanced');
    const stream = simulateRepSeries({ reps: 3 });
    for (const s of stream) engine.ingest(s as any);
    const events = engine.getEvents();
    expect(events.length).toBe(3);
    for (const e of events) {
      expect(e.romDeg).toBeGreaterThanOrEqual(45);
      expect(e.depthScore).toBeGreaterThan(0.9);
      expect(e.stabilityScore).toBeGreaterThan(0.0);
    }
  });

  it('applies stricter thresholds under strict mode', () => {
    const engine = new RepEngine('strict');
    const shallow = simulateRepSeries({ reps: 2, depthFlexDeg: 60 });
    for (const s of shallow) engine.ingest(s as any);
    const events = engine.getEvents();
    // depth too shallow for strict; expect fewer reps than 2
    expect(events.length).toBeLessThan(2);
  });
});

describe('selectTips', () => {
  it('limits to 2 tips and uses style phrasing', () => {
    const faults = ['depth', 'stability', 'speed'];
    const coaching = selectTips('coaching', faults, 2);
    expect(coaching.length).toBe(2);
    expect(coaching[0].toLowerCase()).toContain('depth');

    const hype = selectTips('hype', faults, 2);
    expect(hype.length).toBe(2);
    // stylistic difference likely contains exclamations or stronger tone
    expect(hype[0]).not.toBe(coaching[0]);
  });
});


