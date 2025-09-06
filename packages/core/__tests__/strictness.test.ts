import { beatWindows } from '../src/strictness';
import { Strictness } from '../src/types';

describe('beatWindows strictness behavior', () => {
	it('windows shrink with higher strictness at fixed BPM', () => {
		const bpm = 120;
		const balanced = beatWindows(bpm, Strictness.Balanced);
		const strict = beatWindows(bpm, Strictness.Strict);
		const elite = beatWindows(bpm, Strictness.Elite);

		expect(strict.ecc).toBeLessThanOrEqual(balanced.ecc);
		expect(strict.iso).toBeLessThanOrEqual(balanced.iso);
		expect(strict.con).toBeLessThanOrEqual(balanced.con);

		expect(elite.ecc).toBeLessThanOrEqual(strict.ecc);
		expect(elite.iso).toBeLessThanOrEqual(strict.iso);
		expect(elite.con).toBeLessThanOrEqual(strict.con);
	});

	it('balanced at 120bpm approximately matches expected windows', () => {
		const bpm = 120;
		const w = beatWindows(bpm, Strictness.Balanced);
		// T = 60000/120 = 500ms
		// ecc = max(80, 0.18*500=90) = 90
		// iso = max(60, 0.144*500=72) = 72
		// con = max(70, 0.15*500=75) = 75
		expect(w.ecc).toBeCloseTo(90, 0);
		expect(w.iso).toBeCloseTo(72, 0);
		expect(w.con).toBeCloseTo(75, 0);
	});
});


