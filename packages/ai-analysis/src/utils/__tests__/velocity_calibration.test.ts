import { describe, it, expect } from 'vitest';
import { setPixelScale, pixelsToMeters } from '../velocity';
import { projectPoint } from '../geometry';

describe('velocity calibration', () => {
  it('converts pixel displacement to meters using scale', () => {
    // 500 px/m -> 100 px over 0.25s => 0.2 m / 0.25 s = 0.8 m/s equivalent
    setPixelScale(500);
    const meters = pixelsToMeters(100);
    expect(meters).toBeCloseTo(0.2, 6);
  });

  it('projects two pixel points via homography and preserves proportions', () => {
    // Simple scale-like homography mapping (x,y)->(x/1000,y/1000) in meters
    const H = [
      0.001, 0, 0,
      0, 0.001, 0,
      0, 0, 1,
    ];
    setPixelScale(0, H, 0);
    const p1 = projectPoint(H, 0, 0);
    const p2 = projectPoint(H, 1000, 0); // 1000 px apart horizontally
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    expect(dist).toBeCloseTo(1.0, 6); // 1 meter apart on plane
  });
});


