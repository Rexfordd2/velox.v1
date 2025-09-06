export type MassUnit = 'kg' | 'lb';
export type VelocityUnit = 'm/s' | 'ft/s';

export function getDefaultUnits(locale: string): { mass: MassUnit; velocity: VelocityUnit } {
	const normalized = (locale || '').toLowerCase();
	const usesImperial = /^(en-us|en_?us|us|usa|liberia|myanmar)/.test(normalized);
	return {
		mass: usesImperial ? 'lb' : 'kg',
		velocity: usesImperial ? 'ft/s' : 'm/s',
	};
}

// Mass conversions
export function kgToLb(kg: number): number {
	return kg * 2.2046226218;
}

export function lbToKg(lb: number): number {
	return lb / 2.2046226218;
}

// Time conversions
export function msToS(ms: number): number {
	return ms / 1000;
}

export function sToMs(s: number): number {
	return s * 1000;
}

// Velocity conversions
export function mpsToFtps(mps: number): number {
	return mps * 3.280839895;
}

export function ftpsToMps(ftps: number): number {
	return ftps / 3.280839895;
}


