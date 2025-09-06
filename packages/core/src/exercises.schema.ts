export type PoseCriterion = {
  jointPairs?: [string, string][];
  angle?: { joint: string; min?: number; max?: number };
  rom?: { joint: string; min?: number; max?: number };
  velocity?: { joint: string; min?: number; max?: number };
  holdMs?: number;
  cueOnFail?: string;
  weight?: number;
};

export type ExerciseDefinition = {
  id?: string;
  name: string;
  category: 'lower' | 'upper' | 'core' | 'olympic' | 'other';
  phases: Array<{
    name: string;
    criteria: PoseCriterion[];
    transitionOn: 'angle' | 'velocity' | 'time' | 'landmark';
  }>;
  scoring: { passThreshold: number; severityBands: number[] };
  version: number;
};


