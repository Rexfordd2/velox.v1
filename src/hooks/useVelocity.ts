import { useRef } from "react";

export function useVelocity() {
  const lastY = useRef<number>();
  const lastT = useRef<number>();

  /** returns instantaneous velocity (px/s) */
  const addSample = (y: number, t = Date.now()) => {
    if (lastY.current == null || lastT.current == null) {
      lastY.current = y;
      lastT.current = t;
      return 0;
    }
    const dy = lastY.current - y;
    const dt = (t - lastT.current) / 1000; // s
    lastY.current = y;
    lastT.current = t;
    return dt ? dy / dt : 0;
  };

  return { addSample };
} 