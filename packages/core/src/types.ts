export enum Exercise {
	Squat = 'squat',
	Bench = 'bench',
	Deadlift = 'deadlift',
	Curl = 'curl',
	Hinge = 'hinge',
	Row = 'row',
	OHP = 'ohp',
	HipThrust = 'hip_thrust',
}

export enum CoachingStyle {
	Direct = 'direct',
	Technical = 'technical',
	Encouraging = 'encouraging',
}

export enum Strictness {
	Balanced = 'balanced',
	Strict = 'strict',
	Elite = 'elite',
}

export enum BeatSource {
	Spotify = 'spotify',
	Apple = 'apple',
	Local = 'local',
	VeloxLib = 'veloxLib',
	Silent = 'silent',
}

export enum Phase {
	Eccentric = 'ecc',
	Isometric = 'iso',
	Concentric = 'con',
}

export enum LeaderboardBucket {
	Age = 'age',
	Weight = 'weight',
	Experience = 'experience',
	Region = 'region',
	Gym = 'gym',
	School = 'school',
}

// milliseconds
export interface BeatWindows {
	ecc: number;
	iso: number;
	con: number;
}

export interface DeviceAttestation {
	platform: 'ios' | 'android' | 'web';
	attested: boolean;
	fpHash?: string;
}

export interface RepMetrics {
	meanConVel: number;
	peakConVel: number;
	meanEccVel: number;
	peakEccVel: number;
	mpv: number;
	romM: number;
	tutMs: number;
	powerW: number;
	velLossPct: number;
	est1RM: number;
	lvSlope: number;
	flowScore?: number;
	formScore?: number;
	beatAdherencePct?: number;
}


