import { useProgressiveFeedback } from "../../../apps/mobile/src/hooks/useProgressiveFeedback";
import { renderHook, act } from "@testing-library/react";

describe("useProgressiveFeedback", () => {
  it("returns 'perfect' for consistently high scores", () => {
    const { result } = renderHook(() => useProgressiveFeedback());
    act(() => {
      [95, 98, 93, 97, 96].forEach(result.current.pushScore);
    });
    expect(result.current.tierInfo?.emoji).toBe("🟢");
  });

  it("drops to 'needsWork' when average falls below 75", () => {
    const { result } = renderHook(() => useProgressiveFeedback());
    act(() => {
      [80, 70, 60, 50, 55].forEach(result.current.pushScore);
    });
    expect(result.current.tierInfo?.emoji).toBe("🟠");
  });
}); 