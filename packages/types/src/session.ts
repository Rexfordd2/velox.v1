export interface RepData {
  timestamp: number;
  exerciseName: string;
  velocity: {
    raw: number;
    calibrated: number;
  };
  rom: number;
  confidenceScore: number;
  phaseTransitions: {
    eccentric: number;
    concentric: number;
    lockout: number;
  };
  feedback?: string[];
}

export interface WorkoutSession {
  id: string;
  startTime: number;
  exerciseName: string;
  reps: RepData[];
}

export interface SessionInput {
  exercise_id: string;
  video_path?: string;
  duration_ms: number;
  score: number;
} 