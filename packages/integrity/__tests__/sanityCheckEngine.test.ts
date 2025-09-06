import { describe, it, expect } from 'vitest';
import { checkRep, isLeaderboardEligible, SanityResult } from '../src/sanityCheckEngine';
import { Exercise, RepMetrics } from '@velox/core';

function makeRep(overrides: Partial<RepMetrics> = {}): RepMetrics {
	return {
		meanConVel: 0.8,
		peakConVel: 1.2,
		meanEccVel: 0.7,
		peakEccVel: 1.0,
		mpv: 0.7,
		romM: 0.35,
		tutMs: 1200,
		powerW: 400,
		velLossPct: 20,
		est1RM: 120,
		lvSlope: -0.3,
		...overrides,
	};
}

describe('sanityCheckEngine', () => {
	it('passes a clean rep', () => {
		const rep = makeRep({ peakConVel: 1.6, peakEccVel: 1.4, romM: 0.35 });
		const result = checkRep(Exercise.Squat, rep, {
			category: 'squat_dl',
			lateralJerkCm: 2.0,
			fps: 60,
			romGoalM: 0.3,
		});
		expect(result.ok).toBe(true);
		expect(result.reasons).toHaveLength(0);
		expect(result.integrityScore).toBe(1);
		expect(isLeaderboardEligible(result, 0.85)).toBe(true);
	});

	it('fails on velocity and rom thresholds', () => {
		const rep = makeRep({ peakConVel: 2.2, peakEccVel: 1.7, romM: 0.15 });
		const result = checkRep(Exercise.Bench, rep, {
			category: 'bench',
			fps: 60,
		} );
		expect(result.ok).toBe(false);
		expect(result.reasons).toEqual(expect.arrayContaining(['peakConVel > limit', 'rom < min']));
	});

	it('integrityScore deducts 0.2 per reason and floors at 0', () => {
		const rep = makeRep({ peakConVel: 5, peakEccVel: 5, romM: 0.01 });
		const result = checkRep(Exercise.Deadlift, rep, {
			category: 'squat_dl',
			lateralJerkCm: 10,
			fps: 15,
		});
		// Reasons: con vel, ecc vel, rom, lateral jerk, fps => 5 reasons
		expect(result.reasons.length).toBeGreaterThanOrEqual(5);
		expect(result.integrityScore).toBe(0);
		expect(isLeaderboardEligible(result, 0.95)).toBe(false);
	});
});


