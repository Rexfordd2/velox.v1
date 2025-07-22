import { calcRepMetrics } from "../src/calcRepMetrics";

test("calcRepMetrics returns peakVel, rom, tempo, score", () => {
  const fps = 30;
  const frames = Array.from({ length: 60 }).map((_, i) => ({
    velocity: i < 30 ? i * 0.01 : (60 - i) * 0.01,
    hipDepth: i / 60,
  }));
  const m = calcRepMetrics(frames as any, fps);
  expect(m.peakVel).toBeGreaterThan(0);
  expect(m.rom).toBeGreaterThan(0);
  expect(m.tempo.ecc).toBeGreaterThan(0);
  expect(m.score).toBeGreaterThan(0);
}); 