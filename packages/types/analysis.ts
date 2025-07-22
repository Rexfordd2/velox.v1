export interface FormScore {
  score: number;
  feedback: string[];
  extra?: Record<string, unknown>;
}

export interface VideoMetadata {
  url: string;
  path: string;
  durationMs: number;
  width: number;
  height: number;
}

export interface Exercise {
  id: string;
  name: string;
  icon: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Session {
  id: string;
  userId: string;
  exerciseId: string;
  videoUrl: string;
  formScore: FormScore;
  createdAt: string;
} 