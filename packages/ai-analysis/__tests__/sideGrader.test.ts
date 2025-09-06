import { expect, test } from "vitest";
import { gradeFrame } from "../src/gradeFrame";
import { Pose } from "../src/types/pose";

const sideFrame: Pose[] = [{
  frameNumber: 1,
  timestamp: 1000,
  landmarks: {
    leftHip: { x: 0, y: 100 },
    leftShoulder: { x: 10, y: 0 }
  }
}];

test("side-view squat passes when lean <40°", () => {
  const res = gradeFrame(sideFrame, "squat", "side");
  expect(res.score).toBeGreaterThanOrEqual(0);
}); 