import limits from './movementLimits.json';
import { Exercise, RepMetrics } from '@velox/core';

export interface SanityResult {
	ok: boolean;
	reasons: string[];
	integrityScore: number;
}

type Category = 'bench' | 'squat_dl' | 'olympic' | 'plyo' | 'isolation';

const exerciseToRomKey: Record<Exercise, keyof typeof limits.romMinPct | undefined> = {
	[Exercise.Squat]: 'squat',
	[Exercise.Bench]: 'bench',
	[Exercise.Deadlift]: 'deadlift',
	[Exercise.Curl]: 'curl',
	[Exercise.OHP]: 'ohp',
	[Exercise.Row]: 'row',
	[Exercise.HipThrust]: 'hip_thrust',
	[Exercise.Hinge]: undefined,
};

export function checkRep(
	exercise: Exercise,
	rep: RepMetrics,
	context: {
		category: Category;
		lateralJerkCm?: number;
		formScore?: number;
		fps?: number;
	}
): SanityResult {
	const reasons: string[] = [];

	// Velocity ceilings per category
	const velCaps = limits.velocityMax[context.category];
	if (velCaps) {
		if (typeof rep.peakConVel === 'number' && rep.peakConVel > velCaps.con) {
			reasons.push('peakConVel > limit');
		}
		if (typeof rep.peakEccVel === 'number' && rep.peakEccVel > velCaps.ecc) {
			reasons.push('peakEccVel > limit');
		}
	}

	// ROM minimum relative to goal ROM (fallback 0.3m)
	const romKey = exerciseToRomKey[exercise];
	const romMinPct = romKey ? limits.romMinPct[romKey] : 0.9;
	// Accept optional romGoalM via loose context access; fallback 0.3m
	const goalRomM = (context as unknown as { romGoalM?: number }).romGoalM ?? 0.3;
	if (typeof rep.romM === 'number') {
		const minRom = romMinPct * goalRomM;
		if (rep.romM < minRom) {
			reasons.push('rom < min');
		}
	}

	// Lateral jerk check
	if (typeof context.lateralJerkCm === 'number' && context.lateralJerkCm > limits.lateralJerkCm) {
		reasons.push('lateralJerkCm > limit');
	}

	// FPS check
	if (typeof context.fps === 'number' && context.fps < 30) {
		reasons.push('fps < 30');
	}

	const integrityScore = Math.max(0, 1 - reasons.length * 0.2);
	return {
		ok: reasons.length === 0,
		reasons,
		integrityScore,
	};
}

export function isLeaderboardEligible(result: SanityResult, formScore: number): boolean {
	return result.ok && formScore >= 0.8;
}


