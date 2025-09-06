import { describe, it, expect } from 'vitest';
import { gateForGlobalBoard } from '../src/attestation';

describe('gateForGlobalBoard', () => {
  it('returns ok=true when all inputs are valid', () => {
    const res = gateForGlobalBoard({
      dualAngles: true,
      setupWindowOk: true,
      attested: true,
      fpsOk: true,
    });
    expect(res.ok).toBe(true);
    expect(res.reasons).toEqual([]);
  });

  it('returns ok=false with reasons when any requirement fails', () => {
    const res = gateForGlobalBoard({
      dualAngles: false,
      setupWindowOk: false,
      attested: false,
      fpsOk: false,
    });
    expect(res.ok).toBe(false);
    expect(res.reasons).toEqual(
      expect.arrayContaining([
        'missing_dual_angles',
        'setup_window_invalid',
        'device_not_attested',
        'frame_rate_too_low',
      ])
    );
    expect(res.reasons.length).toBe(4);
  });
});


