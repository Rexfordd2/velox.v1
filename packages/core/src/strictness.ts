import { BeatWindows, Strictness } from './types';

function clampToWindow(floorMs: number, factor: number, T: number): number {
	return Math.max(floorMs, factor * T);
}

/**
 * Compute allowable timing windows per lifting phase based on BPM and strictness.
 * T = 60000 / bpm (ms per beat). window = max(floorMs, factor * T)
 */
export function beatWindows(bpm: number, level: Strictness): BeatWindows {
	if (bpm <= 0 || !Number.isFinite(bpm)) {
		return { ecc: 0, iso: 0, con: 0 };
	}
	const T = 60000 / bpm;

	switch (level) {
		case Strictness.Balanced: {
			return {
				ecc: clampToWindow(80, 0.18, T),
				iso: clampToWindow(60, 0.144, T),
				con: clampToWindow(70, 0.15, T),
			};
		}
		case Strictness.Strict: {
			return {
				ecc: clampToWindow(60, 0.14, T),
				iso: clampToWindow(40, 0.08, T),
				con: clampToWindow(50, 0.12, T),
			};
		}
		case Strictness.Elite: {
			return {
				ecc: clampToWindow(50, 0.12, T),
				iso: clampToWindow(30, 0.06, T),
				con: clampToWindow(40, 0.10, T),
			};
		}
		default: {
			return {
				ecc: clampToWindow(80, 0.18, T),
				iso: clampToWindow(60, 0.12, T),
				con: clampToWindow(70, 0.15, T),
			};
		}
	}
}


