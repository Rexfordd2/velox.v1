import React from "react";
import { evaluateProgressiveFeedback } from "../../../apps/mobile/src/hooks/useProgressiveFeedback";

describe("evaluateProgressiveFeedback", () => {
  it("returns 'perfect' for consistently high scores", () => {
    const res = evaluateProgressiveFeedback([95, 98, 93, 97, 96]);
    expect(res.tierInfo?.emoji).toBe("🟢");
  });

  it("drops to 'needsWork' when average falls below 75", () => {
    const res = evaluateProgressiveFeedback([80, 70, 60, 50, 55]);
    expect(res.tierInfo?.emoji).toBe("🟠");
  });
});