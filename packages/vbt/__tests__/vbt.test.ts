import { describe, it, expect } from 'vitest';
import { computeKinematics } from '../src/kinematics';
import { computeRepMetrics } from '../src/metrics';

function generateSinusoid({
  samples,
  dtMs,
  amplitude,
  periodMs,
  noiseStd = 0,
}: { samples: number; dtMs: number; amplitude: number; periodMs: number; noiseStd?: number; }) {
  const ts: number[] = [];
  const pos: number[] = [];
  const w = (2 * Math.PI) / periodMs;
  for (let i = 0; i < samples; i++) {
    const t = i * dtMs;
    ts.push(t);
    const noise = noiseStd > 0 ? randn() * noiseStd : 0;
    pos.push(amplitude * Math.sin(w * t) + noise);
  }
  return { ts, pos };
}

function randn() {
  // Box-Muller transform
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

describe('VBT kinematics and metrics', () => {
  it('sinusoid synthetic signal produces accurate peak velocities and ROM', () => {
    const dtMs = 10; // 100 Hz
    const periodMs = 1000; // 1 Hz
    const amplitude = 0.2; // 20 cm
    const noiseStd = 0.002; // 2 mm noise
    const { ts, pos } = generateSinusoid({ samples: 1000, dtMs, amplitude, periodMs, noiseStd });

    const { v, a } = computeKinematics(pos, ts);

    // Build phases assuming upward positive velocity is concentric half-cycle
    const phases = ts.map((t, idx) => (v[idx] >= 0 ? 'con' : 'ecc')) as ('ecc'|'iso'|'con')[];
    const m = computeRepMetrics({ massKg: 80, barPosM: pos, v, a, ts, phases });

    const truePeakVel = (2 * Math.PI / periodMs) * amplitude * 1000; // convert 1/ms to 1/s
    // tolerate ±0.10 m/s
    expect(Math.abs(m.peakConVel - truePeakVel)).toBeLessThanOrEqual(0.10);

    const romTrue = 2 * amplitude;
    expect(Math.abs(m.romM - romTrue)).toBeLessThanOrEqual(0.015);

    const mpv = v.filter(x => x > 0).reduce((s, x, _, arr) => s + x / arr.length, 0);
    expect(Math.abs(m.mpv - mpv)).toBeLessThanOrEqual(0.03);
  });
});


