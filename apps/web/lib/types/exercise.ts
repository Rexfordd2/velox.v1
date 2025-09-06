export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseCategory {
  id: number;
  name: string;
}

export interface Exercise {
  id: number;
  name: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  primary_muscle: string;
  secondary_muscles: string[];
  video_demo_url?: string;
  equipment: string[];
  instructions: string[];
  exercise_to_category: {
    category: ExerciseCategory;
  }[];
  created_at: string;
  updated_at: string;
}

export interface ExerciseQuery {
  search?: string;
  difficulty?: Difficulty;
  primary_muscle?: string;
  category_id?: number;
  cursor?: string;
  limit?: number;
  sortBy?: 'created_at' | 'name' | 'difficulty' | 'primary_muscle';
  sortDir?: 'asc' | 'desc';
}

export interface ExerciseResponse {
  items: Exercise[];
  nextCursor?: string;
} 