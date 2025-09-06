export type CanonicalMetric =
	| 'meanConVel'
	| 'peakConVel'
	| 'romM'
	| 'powerW'
	| 'velLossPct'
	| 'est1RM';

export interface BylsContext {
	previous: number | null; // last canonical metric value for same setup
	current: number; // new attempt canonical metric value
	metric: CanonicalMetric;
	// Fairness guards
	massKg?: number; // load used in the attempt
	setup?: {
		stance?: string;
		grip?: string;
		barPath?: string;
		tempo?: string;
	};
	prevMassKg?: number;
	prevSetup?: BylsContext['setup'];
	// Moderation context
	deviceTrusted?: boolean;
	formScore?: number; // 0..1
	integrityScore?: number; // 0..1
	fps?: number;
	videoDurationS?: number;
	locationHash?: string; // coarse location fingerprint
	prevLocationHash?: string;
}

export interface FairnessResult {
	ok: boolean;
	reasons: string[];
}

export interface BylsResult extends FairnessResult {
	improved: boolean;
	delta: number; // signed delta current - previous
}

// Metric direction: larger-is-better or smaller-is-better
function isHigherBetter(metric: CanonicalMetric): boolean {
	// For velocity, ROM, power, est1RM: higher better. For velLossPct: lower better.
	return metric !== 'velLossPct';
}

export function checkFairnessGuards(ctx: BylsContext): FairnessResult {
	const reasons: string[] = [];

	// Same load guard (within 2%)
	if (typeof ctx.massKg === 'number' && typeof ctx.prevMassKg === 'number') {
		const relDiff = Math.abs(ctx.massKg - ctx.prevMassKg) / Math.max(1, ctx.prevMassKg);
		if (relDiff >= 0.02) {
			reasons.push('load_changed');
		}
	}

	// Same setup guard: require equality when provided
	const keys: (keyof NonNullable<BylsContext['setup']>)[] = ['stance', 'grip', 'barPath', 'tempo'];
	if (ctx.setup && ctx.prevSetup) {
		for (const k of keys) {
			if (ctx.setup[k] && ctx.prevSetup[k] && ctx.setup[k] !== ctx.prevSetup[k]) {
				reasons.push(`setup_${k}_changed`);
			}
		}
	}

	// Moderation checks
	if (ctx.formScore !== undefined && ctx.formScore < 0.5) reasons.push('low_form_score');
	if (ctx.integrityScore !== undefined && ctx.integrityScore < 0.6) reasons.push('low_integrity_score');
	if (ctx.fps !== undefined && ctx.fps < 30) reasons.push('low_fps');
	if (ctx.videoDurationS !== undefined && ctx.videoDurationS < 2) reasons.push('video_too_short');
	if (ctx.deviceTrusted === false) reasons.push('untrusted_device');
	if (ctx.locationHash && ctx.prevLocationHash && ctx.locationHash !== ctx.prevLocationHash) reasons.push('location_changed');

	return { ok: reasons.length === 0, reasons };
}

export function evaluateByls(ctx: BylsContext): BylsResult {
	const fairness = checkFairnessGuards(ctx);
	const previous = ctx.previous;
	const current = ctx.current;

	let improved = false;
	let delta = 0;
	if (typeof previous === 'number') {
		delta = current - previous;
		if (isHigherBetter(ctx.metric)) {
			improved = delta > 0;
		} else {
			improved = delta < 0;
		}
	} else {
		// No prior metric; consider any valid current as improvement baseline
		improved = true;
		delta = NaN;
	}

	return { ok: fairness.ok, reasons: fairness.reasons, improved, delta };
}

// Call-out quotas & moderation checks
export interface CalloutQuotaContext {
	userId: string;
	periodCalls: number; // how many call-outs in the current period
	periodAccepted: number; // accepted/verified call-outs
	periodRejected: number; // rejected or failed moderation
	maxCallsPerDay?: number; // default 5
	minAcceptRate?: number; // default 0.3
	maxRejects?: number; // default 3
}

export function enforceCalloutQuotas(ctx: CalloutQuotaContext): { allowed: boolean; reasons: string[] } {
	const reasons: string[] = [];
	const maxCalls = ctx.maxCallsPerDay ?? 5;
	const minAccept = ctx.minAcceptRate ?? 0.3;
	const maxRejects = ctx.maxRejects ?? 3;

	if (ctx.periodCalls >= maxCalls) reasons.push('quota_exceeded');
	const total = Math.max(1, ctx.periodCalls);
	const acceptRate = ctx.periodAccepted / total;
	if (ctx.periodCalls >= 3 && acceptRate < minAccept) reasons.push('low_accept_rate');
	if (ctx.periodRejected >= maxRejects) reasons.push('too_many_rejections');

	return { allowed: reasons.length === 0, reasons };
}


