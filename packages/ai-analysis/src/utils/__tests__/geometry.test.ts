import { describe, it, expect } from 'vitest';
import { computeHomography, projectPoint } from '../geometry';

describe('geometry', () => {
  it('computes homography for unit square mapping', () => {
    const src: [number, number][] = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ];
    const dst: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const H = computeHomography(src, dst);
    const p = projectPoint(H, 1, 1);
    expect(p.x).toBeCloseTo(0.5, 5);
    expect(p.y).toBeCloseTo(0.5, 5);
  });
});


