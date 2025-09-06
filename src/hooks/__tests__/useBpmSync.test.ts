import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useBpmSync } from '../../hooks/useBpmSync';

// jsdom uses performance.now; we'll control it
let now = 0;
const origNow = globalThis.performance?.now ?? (() => Date.now());

function advance(ms: number) { now += ms; }
async function flush() {
	await Promise.resolve();
	vi.advanceTimersByTime(0);
}

beforeEach(() => {
	now = 0;
	vi.useFakeTimers();
	// @ts-ignore
	if (!globalThis.performance) (globalThis as any).performance = { now: () => now };
	else (globalThis.performance as any).now = () => now;
	// Shim requestAnimationFrame using setTimeout and our monotonic clock
	// @ts-ignore
	globalThis.requestAnimationFrame = (cb: (t: number) => void) => {
		const id = setTimeout(() => cb(now), 0) as unknown as number;
		return id;
	};
	// @ts-ignore
	globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id as unknown as number);
});

afterEach(() => {
	vi.useRealTimers();
	// restore
	if (globalThis.performance) (globalThis as any).now = origNow;
});

describe('useBpmSync', () => {
	it('runs 30s at 90 BPM with low drift and stays running', async () => {
		const exposed: { status: any; controls: any } = { status: null, controls: null };
		function Harness() {
			const [status, controls] = useBpmSync({ initialBpm: 90, audio: false, haptics: false });
			(exposed as any).status = status;
			(exposed as any).controls = controls;
			return null as any;
		}
		render(React.createElement(Harness));
		await flush();
		expect(exposed.controls).toBeTruthy();
		act(() => { exposed.controls!.start(); });
		for (let t = 0; t <= 30000; t += 16) {
			act(() => {
				advance(16);
				vi.advanceTimersByTime(0);
			});
		}
		expect(exposed.status.isRunning).toBe(true);
		expect(exposed.status.driftPct).toBeLessThan(1.5);
	});

	it('tap tempo adjusts BPM near tapped 100 BPM', async () => {
		const exposed: { status: any; controls: any } = { status: null, controls: null };
		function Harness() {
			const [status, controls] = useBpmSync({ initialBpm: 120, audio: false, haptics: false });
			(exposed as any).status = status;
			(exposed as any).controls = controls;
			return null as any;
		}
		render(React.createElement(Harness));
		await flush();
		expect(exposed.controls).toBeTruthy();
		act(() => { exposed.controls!.start(); });
		for (let i = 0; i < 4; i++) {
			act(() => { exposed.controls.tap(); });
			act(() => { advance(600); vi.advanceTimersByTime(0); });
		}
		expect(exposed.status.bpm).toBeGreaterThanOrEqual(98);
		expect(exposed.status.bpm).toBeLessThanOrEqual(102);
	});
});


