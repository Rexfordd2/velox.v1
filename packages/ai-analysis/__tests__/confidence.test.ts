import { expect, test } from "vitest";
import { calcRepMetrics } from "../src/calcRepMetrics";

test("confidence high when jitter tiny", () => {
  const frames = Array.from({ length: 10 }, (_, i) => ({
    keypoints: { hip: { y: 100 + Math.sin(i) * 0.1 } },
  })) as any;
  const { confidence } = calcRepMetrics(frames);
  expect(confidence).toBeGreaterThan(0.8);
});

test("confidence low when jitter large", () => {
  const frames = Array.from({ length: 10 }, (_, i) => ({
    keypoints: { hip: { y: 100 + Math.sin(i) * 20 } },
  })) as any;
  const { confidence } = calcRepMetrics(frames);
  expect(confidence).toBeLessThan(0.5);
});

test("confidence mid-range for moderate jitter", () => {
  const frames = Array.from({ length: 10 }, (_, i) => ({
    keypoints: { hip: { y: 100 + Math.sin(i) * 5 } },
  })) as any;
  const { confidence } = calcRepMetrics(frames);
  expect(confidence).toBeGreaterThan(0.4);
  expect(confidence).toBeLessThan(0.9);
}); 