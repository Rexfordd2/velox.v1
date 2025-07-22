import { expect, test } from "vitest";
import { within } from "../../../apps/mobile/src/components/PoseGuideOverlay";

test("within utility", () => {
  expect(within(80, 70, 100)).toBe(true);
  expect(within(60, 70, 100)).toBe(false);
  expect(within(100, 70, 100)).toBe(true);
  expect(within(70, 70, 100)).toBe(true);
  expect(within(101, 70, 100)).toBe(false);
  expect(within(69, 70, 100)).toBe(false);
}); 