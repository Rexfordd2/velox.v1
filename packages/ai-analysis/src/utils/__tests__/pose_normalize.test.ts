import { describe, it, expect } from 'vitest';
import { normalizePose } from '../../utils/poseNormalize';

describe('normalizePose', () => {
  it('centers, rotates, and scales by shoulder width', () => {
    const landmarks = {
      leftShoulder: { x: -1, y: 0, visibility: 1 },
      rightShoulder: { x: 1, y: 0, visibility: 1 },
      leftHip: { x: -1, y: 2, visibility: 1 },
      rightHip: { x: 1, y: 2, visibility: 1 },
      nose: { x: 0, y: -1, visibility: 1 },
    } as any;

    const out = normalizePose(landmarks);
    // Pelvis at origin; nose should be at y ~ -1.5 after scaling by shoulder width=2
    expect(out.nose!.x).toBeCloseTo(0, 6);
    expect(out.nose!.y).toBeCloseTo(-1.5, 6);
  });
});


