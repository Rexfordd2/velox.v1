import { expect, test } from "vitest";

test("scale converts px→m correctly", () => {
  const pxPerMeter = 200;
  const dxPx = 100;
  const m = dxPx / pxPerMeter;
  expect(m).toBeCloseTo(0.5);
}); 