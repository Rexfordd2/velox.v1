export const VIBE_TAGS = {
	HighEnergy: [
		'upbeat',
		'aggressive',
		'fast-tempo',
		'bass-heavy',
		'pump',
	],
	FocusedTechnical: [
		'minimal',
		'clean-rhythm',
		'precision',
		'instrumental',
		'concentration',
	],
	FlowRhythm: [
		'groove',
		'syncopated',
		'smooth',
		'lofi-house',
		'head-nod',
	],
	Recovery: [
		'ambient',
		'chill',
		'low-tempo',
		'soft',
		'breathwork',
	],
	Competitive: [
		'anthemic',
		'dramatic',
		'epic',
		'big-drop',
		'hype',
	],
	EmotionalStory: [
		'lyrical',
		'vocal-forward',
		'build-and-release',
		'melodic',
		'emotive',
	],
	Experimental: [
		'polyrhythmic',
		'glitch',
		'switch-ups',
		'odd-meter',
		'leftfield',
	],
} as const;

type TrainingGoal = 'strength' | 'speed' | 'endurance' | 'weight_loss' | 'rehab' | 'fun';

export function vibeIndex(params: { goal: TrainingGoal }): string[] {
	switch (params.goal) {
		case 'strength':
			return VIBE_TAGS.HighEnergy;
		case 'speed':
			return VIBE_TAGS.FlowRhythm;
		case 'endurance':
			return VIBE_TAGS.FlowRhythm;
		case 'weight_loss':
			return VIBE_TAGS.HighEnergy;
		case 'rehab':
			return VIBE_TAGS.Recovery;
		case 'fun':
			return VIBE_TAGS.Experimental;
		default:
			return VIBE_TAGS.FocusedTechnical;
	}
}


